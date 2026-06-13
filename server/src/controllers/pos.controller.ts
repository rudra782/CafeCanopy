import { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { Server as SocketServer } from 'socket.io';
import { sendReceiptEmail } from '../services/email.service';

// Promotion engine - calculates discounts automatically
export const applyPromotions = async (items: any[], orderTotal: number) => {
  const promotions = await query(
    `SELECT * FROM promotions WHERE active = true AND (valid_until IS NULL OR valid_until > NOW())`
  );

  let totalProductDiscount = 0;
  let totalOrderDiscount = 0;
  const appliedPromotions: any[] = [];

  for (const promo of promotions.rows) {
    if (promo.promotion_type === 'product') {
      for (const item of items) {
        if (promo.product_id && item.product_id !== promo.product_id) continue;
        if (item.quantity >= promo.minimum_quantity) {
          const discount = promo.discount_type === 'percentage'
            ? (item.line_total * promo.discount_value) / 100
            : Math.min(promo.discount_value, item.line_total);
          totalProductDiscount += discount;
          appliedPromotions.push({ name: promo.name, discount });
        }
      }
    } else if (promo.promotion_type === 'order') {
      if (orderTotal >= promo.minimum_amount) {
        const discount = promo.discount_type === 'percentage'
          ? (orderTotal * promo.discount_value) / 100
          : promo.discount_value;
        totalOrderDiscount += discount;
        appliedPromotions.push({ name: promo.name, discount });
      }
    }
  }

  return { totalProductDiscount, totalOrderDiscount, appliedPromotions };
};

// Sessions
export const openSession = async (req: AuthRequest, res: Response) => {
  try {
    const { opening_amount = 0 } = req.body;
    // Check if session already open for this employee
    const existing = await query(
      `SELECT id FROM sessions WHERE opened_by = $1 AND status = 'open'`,
      [req.user!.id]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ success: false, message: 'A session is already open', data: existing.rows[0] });
    }
    const result = await query(
      `INSERT INTO sessions (opened_by, opening_amount, status) VALUES ($1, $2, 'open') RETURNING *`,
      [req.user!.id, opening_amount]
    );
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Session opened' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to open session' });
  }
};

export const getOpenSession = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT s.*, u.name as opened_by_name,
        COUNT(o.id)::int as order_count,
        COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total ELSE 0 END), 0) as revenue
       FROM sessions s JOIN users u ON s.opened_by = u.id
       LEFT JOIN orders o ON o.session_id = s.id
       WHERE s.opened_by = $1 AND s.status = 'open' GROUP BY s.id, u.name`,
      [req.user!.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'No open session found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get session' });
  }
};

export const closeSession = async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const sessionId = req.params.id;

    // Get session stats first, including opening_amount
    const stats = await query(
      `SELECT 
        s.opening_amount,
        (SELECT COUNT(*)::int FROM orders WHERE session_id = $1 AND status = 'paid') as order_count,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE session_id = $1 AND status = 'paid') as total_revenue,
        (SELECT COALESCE(SUM(discount_amount), 0) FROM orders WHERE session_id = $1 AND status = 'paid') as total_discounts,
        (
          SELECT json_object_agg(name, amount)
          FROM (
            SELECT pm.name, COALESCE(SUM(CASE WHEN o.session_id = $1 AND p.status = 'completed' THEN p.amount ELSE 0 END), 0) as amount
            FROM payment_methods pm
            LEFT JOIN payments p ON p.payment_method_id = pm.id
            LEFT JOIN orders o ON p.order_id = o.id
            GROUP BY pm.id, pm.name
          ) pb
        ) as payment_breakdown
       FROM sessions s WHERE s.id = $1`,
      [sessionId]
    );

    const statsData = stats.rows[0] || { opening_amount: 0, order_count: 0, total_revenue: 0, total_discounts: 0, payment_breakdown: {} };
    const openingAmount = Number(statsData.opening_amount || 0);
    const totalRevenue = Number(statsData.total_revenue || 0);
    
    // Closing cash = opening cash + total paid billing revenue
    const calculatedClosingAmount = openingAmount + totalRevenue;

    const result = await query(
      `UPDATE sessions SET status = 'closed', closed_at = NOW(), closing_amount = $1, notes = $2
       WHERE id = $3 AND opened_by = $4 RETURNING *`,
      [calculatedClosingAmount, notes || '', sessionId, req.user!.id]
    );

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Session not found' });

    return res.json({
      success: true,
      data: { ...result.rows[0], stats: statsData },
      message: 'Session closed'
    });
  } catch (error) {
    console.error('[CLOSE_SESSION]', error);
    return res.status(500).json({ success: false, message: 'Failed to close session' });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await query(
      `SELECT s.*, u.name as employee_name,
        (SELECT COUNT(*)::int FROM orders WHERE session_id = s.id AND status = 'paid') as order_count,
        COALESCE(s.closing_amount - s.opening_amount, (SELECT COALESCE(SUM(total), 0) FROM orders WHERE session_id = s.id AND status = 'paid')) as total_revenue
       FROM sessions s JOIN users u ON s.opened_by = u.id
       ORDER BY s.opened_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

// Orders
let io: SocketServer;
export const setSocketServer = (socketServer: SocketServer) => { io = socketServer; };

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { search, status, session_id, customer_id, table_id, from_date, to_date, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (search) {
      conditions.push(`(o.order_number ILIKE $${idx} OR c.name ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { conditions.push(`o.status = $${idx++}`); params.push(status); }
    if (session_id) { conditions.push(`o.session_id = $${idx++}`); params.push(session_id); }
    if (customer_id) { conditions.push(`o.customer_id = $${idx++}`); params.push(customer_id); }
    if (table_id) { conditions.push(`o.table_id = $${idx++}`); params.push(table_id); }
    if (from_date) { conditions.push(`o.created_at >= $${idx++}`); params.push(from_date); }
    if (to_date) { conditions.push(`o.created_at <= $${idx++}`); params.push(to_date); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [data, count] = await Promise.all([
      query(
        `SELECT o.*, c.name as customer_name, u.name as employee_name, t.table_number,
          COUNT(oi.id)::int as item_count
         FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN users u ON o.employee_id = u.id
         LEFT JOIN tables t ON o.table_id = t.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         ${where} GROUP BY o.id, c.name, u.name, t.table_number
         ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, Number(limit), offset]
      ),
      query(`SELECT COUNT(*) FROM orders o LEFT JOIN customers c ON o.customer_id = c.id ${where}`, params)
    ]);

    return res.json({
      success: true, data: data.rows,
      pagination: { total: Number(count.rows[0].count), page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const [orderResult, itemsResult, paymentsResult] = await Promise.all([
      query(
        `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
          u.name as employee_name, t.table_number, f.name as floor_name
         FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN users u ON o.employee_id = u.id
         LEFT JOIN tables t ON o.table_id = t.id LEFT JOIN floors f ON t.floor_id = f.id
         WHERE o.id = $1`,
        [req.params.id]
      ),
      query(
        `SELECT oi.*, p.name as product_name, p.image_url, p.unit_of_measure FROM order_items oi
         JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
        [req.params.id]
      ),
      query(
        `SELECT pay.*, pm.name as payment_method_name, pm.type as payment_type FROM payments pay
         JOIN payment_methods pm ON pay.payment_method_id = pm.id WHERE pay.order_id = $1`,
        [req.params.id]
      )
    ]);

    if (!orderResult.rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });

    return res.json({
      success: true,
      data: { ...orderResult.rows[0], items: itemsResult.rows, payments: paymentsResult.rows }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { table_id, customer_id, session_id, items, coupon_code, notes } = req.body;

    if (!items?.length) return res.status(400).json({ success: false, message: 'Order must have at least one item' });

    // Generate order number
    const count = await query(`SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE`);
    const orderNumber = `CC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Number(count.rows[0].count) + 1).padStart(4, '0')}`;

    // Fetch product prices
    const productIds = items.map((i: any) => i.product_id);
    const productsResult = await query(`SELECT * FROM products WHERE id = ANY($1)`, [productIds]);
    const productMap = new Map(productsResult.rows.map((p: any) => [p.id, p]));

    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = items.map((item: any) => {
      const product = productMap.get(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      const price = product.price;
      const lineTotal = price * item.quantity;
      const tax = (lineTotal * product.tax) / 100;
      subtotal += lineTotal;
      taxAmount += tax;
      return { ...item, price, line_total: lineTotal, tax: product.tax };
    });

    // Apply promotions
    const { totalProductDiscount, totalOrderDiscount, appliedPromotions } = await applyPromotions(
      processedItems.map((i: any) => ({ ...i, line_total: i.price * i.quantity })),
      subtotal
    );

    // Apply coupon
    let couponDiscount = 0;
    let couponId = null;
    if (coupon_code) {
      const couponResult = await query(
        `SELECT * FROM coupons WHERE code = $1 AND active = true AND (valid_until IS NULL OR valid_until > NOW())`,
        [coupon_code.toUpperCase()]
      );
      const coupon = couponResult.rows[0];
      if (coupon) {
        couponDiscount = coupon.discount_type === 'percentage'
          ? (subtotal * coupon.discount_value) / 100
          : coupon.discount_value;
        if (coupon.maximum_discount) couponDiscount = Math.min(couponDiscount, coupon.maximum_discount);
        couponId = coupon.id;
        await query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [coupon.id]);
      }
    }

    const promotionDiscount = totalProductDiscount + totalOrderDiscount;
    const totalDiscount = couponDiscount + promotionDiscount;
    const total = Math.max(0, subtotal + taxAmount - totalDiscount);

    // Create order
    const orderResult = await query(
      `INSERT INTO orders (order_number, table_id, customer_id, employee_id, session_id,
        status, subtotal, tax_amount, discount_amount, total, coupon_id, coupon_discount,
        promotion_discount, notes)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [orderNumber, table_id, customer_id, req.user!.id, session_id,
        subtotal, taxAmount, totalDiscount, total, couponId, couponDiscount, promotionDiscount, notes]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of processedItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, tax, line_total, discount, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, item.product_id, item.quantity, item.price, item.tax, item.line_total, item.discount || 0, item.notes]
      );
    }

    // Update table status if table assigned
    if (table_id) {
      await query(`UPDATE tables SET status = 'occupied' WHERE id = $1`, [table_id]);
      io?.emit('table:status_changed', { table_id, status: 'occupied' });
    }

    io?.emit('order:created', { order_id: order.id, order_number: orderNumber });

    return res.status(201).json({
      success: true, data: { ...order, items: processedItems, applied_promotions: appliedPromotions },
      message: 'Order created'
    });
  } catch (error: any) {
    console.error('[ORDER] Create error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, customer_id, table_id, notes } = req.body;
    const { id } = req.params;

    // Only draft orders can be edited
    const existing = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (!existing.rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });
    if (existing.rows[0].status === 'paid' || existing.rows[0].status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Paid or cancelled orders cannot be edited' });
    }

    // Delete existing items and recalculate
    await query(`DELETE FROM order_items WHERE order_id = $1`, [id]);

    const productIds = items.map((i: any) => i.product_id);
    const productsResult = await query(`SELECT * FROM products WHERE id = ANY($1)`, [productIds]);
    const productMap = new Map(productsResult.rows.map((p: any) => [p.id, p]));

    let subtotal = 0, taxAmount = 0;
    const processedItems = items.map((item: any) => {
      const product = productMap.get(item.product_id);
      const price = product.price;
      const lineTotal = price * item.quantity;
      const tax = (lineTotal * product.tax) / 100;
      subtotal += lineTotal; taxAmount += tax;
      return { ...item, price, line_total: lineTotal, tax: product.tax };
    });

    const { totalProductDiscount, totalOrderDiscount } = await applyPromotions(processedItems, subtotal);
    const promotionDiscount = totalProductDiscount + totalOrderDiscount;
    const coupon = existing.rows[0];
    const totalDiscount = (coupon.coupon_discount || 0) + promotionDiscount;
    const total = Math.max(0, subtotal + taxAmount - totalDiscount);

    await query(
      `UPDATE orders SET customer_id=$1, table_id=$2, subtotal=$3, tax_amount=$4,
       discount_amount=$5, total=$6, promotion_discount=$7, notes=$8, employee_id=$9, updated_at=NOW() WHERE id=$10`,
      [customer_id, table_id, subtotal, taxAmount, totalDiscount, total, promotionDiscount, notes, req.user!.id, id]
    );

    for (const item of processedItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, tax, line_total, discount)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, item.product_id, item.quantity, item.price, item.tax, item.line_total, 0]
      );
    }

    io?.emit('order:updated', { order_id: id });
    return res.json({ success: true, message: 'Order updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND status IN ('draft', 'sent_to_kitchen') RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled' });

    // Free up table
    if (result.rows[0].table_id) {
      await query(`UPDATE tables SET status = 'available' WHERE id = $1`, [result.rows[0].table_id]);
      io?.emit('table:status_changed', { table_id: result.rows[0].table_id, status: 'available' });
    }

    io?.emit('order:cancelled', { order_id: req.params.id });
    return res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

export const sendToKitchen = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await query(`SELECT * FROM orders WHERE id = $1`, [id]);
    if (!order.rows[0]) return res.status(404).json({ success: false, message: 'Order not found' });

    await query(
      `UPDATE orders SET status = 'sent_to_kitchen', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Create or update kitchen ticket
    const existing = await query(`SELECT id FROM kitchen_tickets WHERE order_id = $1`, [id]);
    if (!existing.rows[0]) {
      await query(`INSERT INTO kitchen_tickets (order_id, stage) VALUES ($1, 'to_cook')`, [id]);
    } else {
      await query(`UPDATE kitchen_tickets SET stage = 'to_cook', updated_at = NOW() WHERE order_id = $1`, [id]);
    }

    // Emit kitchen update with full order details
    const kitchenOrder = await query(
      `SELECT o.*, t.table_number, c.name as customer_name,
        json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'name', p.name,
          'quantity', oi.quantity, 'notes', oi.notes, 'kitchen_status', oi.kitchen_status)) as items
       FROM orders o LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN customers c ON o.customer_id = c.id
       JOIN order_items oi ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND p.kitchen_enabled = true GROUP BY o.id, t.table_number, c.name`,
      [id]
    );

    io?.emit('kitchen:new_ticket', kitchenOrder.rows[0]);
    return res.json({ success: true, message: 'Order sent to kitchen' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send to kitchen' });
  }
};

export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { payments: paymentData } = req.body;

    const order = await query(`SELECT * FROM orders WHERE id = $1 AND status != 'paid'`, [id]);
    if (!order.rows[0]) return res.status(404).json({ success: false, message: 'Order not found or already paid' });

    // Insert payments
    for (const p of paymentData) {
      await query(
        `INSERT INTO payments (order_id, payment_method_id, amount, amount_received, change_due, transaction_reference, status)
         VALUES ($1,$2,$3,$4,$5,$6,'completed')`,
        [id, p.payment_method_id, p.amount, p.amount_received, p.change_due || 0, p.transaction_reference || null]
      );
    }

    // Fetch employee's active session
    const activeSession = await query(
      `SELECT id FROM sessions WHERE opened_by = $1 AND status = 'open'`,
      [req.user!.id]
    );
    const sessionId = activeSession.rows[0]?.id || null;

    // Mark order as paid and bind to active session
    await query(
      `UPDATE orders SET status = 'paid', employee_id = $2, session_id = $3, updated_at = NOW() WHERE id = $1`,
      [id, req.user!.id, sessionId]
    );

    // Update table
    if (order.rows[0].table_id) {
      await query(`UPDATE tables SET status = 'available' WHERE id = $1`, [order.rows[0].table_id]);
      io?.emit('table:status_changed', { table_id: order.rows[0].table_id, status: 'available' });
    }

    // Update kitchen ticket if exists
    await query(
      `UPDATE kitchen_tickets SET stage = 'completed', completed_at = NOW() WHERE order_id = $1`,
      [id]
    );

    // Loyalty points: 1 point per rupee
    if (order.rows[0].customer_id) {
      const points = Math.floor(order.rows[0].total);
      await query(
        `UPDATE loyalty_accounts SET points = points + $1, lifetime_points = lifetime_points + $1,
         tier = CASE WHEN lifetime_points + $1 >= 15000 THEN 'platinum'
                     WHEN lifetime_points + $1 >= 5000 THEN 'gold'
                     WHEN lifetime_points + $1 >= 1000 THEN 'silver'
                     ELSE 'bronze' END
         WHERE customer_id = $2`,
        [points, order.rows[0].customer_id]
      );
      await query(
        `INSERT INTO loyalty_transactions (customer_id, points, type, description, order_id)
         VALUES ($1, $2, 'earn', $3, $4)`,
        [order.rows[0].customer_id, points, `Earned from order ${order.rows[0].order_number}`, id]
      );
    }

    io?.emit('order:paid', { order_id: id, order_number: order.rows[0].order_number });
    io?.emit('dashboard:stats_updated');

    // Send receipt email asynchronously to the customer if registered
    if (order.rows[0].customer_id) {
      (async () => {
        try {
          const customerRes = await query(`SELECT email FROM customers WHERE id = $1`, [order.rows[0].customer_id]);
          const customerEmail = customerRes.rows[0]?.email;
          if (customerEmail) {
            const [fullOrderRes, itemsRes, paymentsRes, settingsRes] = await Promise.all([
              query(`SELECT o.*, t.table_number FROM orders o LEFT JOIN tables t ON o.table_id = t.id WHERE o.id = $1`, [id]),
              query(`SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`, [id]),
              query(`SELECT p.*, pm.name as payment_method_name FROM payments p JOIN payment_methods pm ON p.payment_method_id = pm.id WHERE p.order_id = $1`, [id]),
              query(`SELECT * FROM settings`),
            ]);

            const settingsMap: Record<string, string> = {};
            settingsRes.rows.forEach((r: any) => {
              settingsMap[r.key] = r.value;
            });

            await sendReceiptEmail(customerEmail, {
              order: {
                ...fullOrderRes.rows[0],
                subtotal: parseFloat(fullOrderRes.rows[0].subtotal || 0),
                tax_amount: parseFloat(fullOrderRes.rows[0].tax_amount || 0),
                discount_amount: parseFloat(fullOrderRes.rows[0].discount_amount || 0),
                total: parseFloat(fullOrderRes.rows[0].total || 0),
              },
              items: itemsRes.rows.map((item: any) => ({
                ...item,
                price: parseFloat(item.price || 0),
                line_total: parseFloat(item.line_total || 0),
              })),
              payments: paymentsRes.rows.map((pay: any) => ({
                ...pay,
                amount: parseFloat(pay.amount || 0),
              })),
              settings: settingsMap,
            });
            console.log(`[PAYMENT] Receipt successfully emailed to ${customerEmail}`);
          }
        } catch (mailErr) {
          console.error('[PAYMENT] Failed to send receipt email:', mailErr);
        }
      })();
    }

    return res.json({ success: true, message: 'Payment processed successfully' });
  } catch (error: any) {
    console.error('[PAYMENT] Error:', error);
    return res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
};

// Kitchen endpoints
export const getKitchenTickets = async (req: Request, res: Response) => {
  try {
    const { stage, search } = req.query;
    const conditions: string[] = [`kt.stage != 'completed' OR (kt.stage = 'completed' AND kt.completed_at > NOW() - INTERVAL '1 hour')`];
    const params: any[] = [];
    let idx = 1;
    if (stage) {
      const stages = (stage as string).split(',');
      conditions.push(`kt.stage = ANY($${idx++})`);
      params.push(stages);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT kt.*, o.order_number, o.notes as order_notes, t.table_number, c.name as customer_name,
        json_agg(json_build_object(
          'id', oi.id, 'product_id', oi.product_id, 'name', p.name,
          'quantity', oi.quantity, 'notes', oi.notes, 'kitchen_status', oi.kitchen_status,
          'category', cat.name
        ) ORDER BY oi.created_at) as items
       FROM kitchen_tickets kt
       JOIN orders o ON kt.order_id = o.id LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN customers c ON o.customer_id = c.id
       JOIN order_items oi ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories cat ON p.category_id = cat.id
       ${where} AND p.kitchen_enabled = true
       GROUP BY kt.id, o.order_number, o.notes, t.table_number, c.name
       ORDER BY kt.created_at ASC`,
      params
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch kitchen tickets' });
  }
};

export const updateKitchenTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { stage } = req.body;
    
    if (stage === 'delivered') {
      await query(`DELETE FROM kitchen_tickets WHERE id = $1`, [req.params.id]);
      io?.emit('kitchen:ticket_updated', { ticket_id: req.params.id, stage: 'delivered' });
      return res.json({ success: true, message: 'Ticket removed' });
    }

    const extra = stage === 'preparing' ? `, started_at = NOW()` : stage === 'completed' ? `, completed_at = NOW()` : '';
    const result = await query(
      `UPDATE kitchen_tickets SET stage = $1${extra}, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [stage, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Update order status
    if (stage === 'preparing') {
      await query(`UPDATE orders SET status = 'preparing' WHERE id = $1`, [result.rows[0].order_id]);
    } else if (stage === 'completed') {
      await query(`UPDATE orders SET status = 'ready' WHERE id = $1`, [result.rows[0].order_id]);
    }

    io?.emit('kitchen:ticket_updated', { ticket_id: req.params.id, stage, order_id: result.rows[0].order_id });
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update kitchen ticket' });
  }
};

export const updateOrderItemStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { kitchen_status } = req.body;
    await query(`UPDATE order_items SET kitchen_status = $1 WHERE id = $2`, [kitchen_status, req.params.itemId]);
    io?.emit('kitchen:item_updated', { item_id: req.params.itemId, kitchen_status });
    return res.json({ success: true, message: 'Item status updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update item status' });
  }
};

// Reports
export const getReports = async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, employee_id, session_id } = req.query;
    const dateFrom = from_date || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const dateTo = to_date || new Date().toISOString();

    const conditions: string[] = [`o.created_at BETWEEN $1 AND $2`, `o.status = 'paid'`];
    const params: any[] = [dateFrom, dateTo];
    let idx = 3;
    if (employee_id) { conditions.push(`o.employee_id = $${idx++}`); params.push(employee_id); }
    if (session_id) { conditions.push(`o.session_id = $${idx++}`); params.push(session_id); }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const [kpis, salesTrend, topProducts, topCategories, paymentDist, employeePerf, recentOrders, sessionSummary] = await Promise.all([
      // KPIs
      query(`SELECT COUNT(o.id)::int as total_orders, COALESCE(SUM(o.total), 0) as revenue,
              COALESCE(AVG(o.total), 0) as avg_order_value, COALESCE(SUM(o.discount_amount), 0) as total_discounts,
              COUNT(DISTINCT o.customer_id)::int as total_customers FROM orders o ${where}`, params),
      // Sales trend
      query(`SELECT DATE(o.created_at) as date, COUNT(*)::int as orders, SUM(o.total) as revenue
             FROM orders o ${where} GROUP BY DATE(o.created_at) ORDER BY date`, params),
      // Top products
      query(`SELECT p.name, p.image_url, SUM(oi.quantity)::int as quantity, SUM(oi.line_total) as revenue
             FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id
             ${where} GROUP BY p.id, p.name, p.image_url ORDER BY revenue DESC LIMIT 10`, params),
      // Top categories
      query(`SELECT cat.name, cat.color, SUM(oi.quantity)::int as quantity, SUM(oi.line_total) as revenue
             FROM orders o JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id JOIN categories cat ON p.category_id = cat.id
             ${where} GROUP BY cat.id, cat.name, cat.color ORDER BY revenue DESC`, params),
      // Payment distribution
      query(`SELECT pm.name, pm.type, COUNT(pay.id)::int as count, SUM(pay.amount) as amount
             FROM orders o JOIN payments pay ON pay.order_id = o.id
             JOIN payment_methods pm ON pay.payment_method_id = pm.id
             ${where} GROUP BY pm.id, pm.name, pm.type ORDER BY amount DESC`, params),
      // Employee performance
      query(`SELECT u.name, COUNT(o.id)::int as orders, SUM(o.total) as revenue
             FROM orders o JOIN users u ON o.employee_id = u.id ${where} GROUP BY u.id, u.name ORDER BY revenue DESC`, params),
      // Recent orders
      query(`SELECT o.order_number, c.name as customer_name, o.total, o.created_at
             FROM orders o LEFT JOIN customers c ON o.customer_id = c.id ${where} ORDER BY o.created_at DESC LIMIT 10`, params),
      // Session summary
      query(`SELECT s.id, u.name as opened_by, s.opened_at, s.closed_at, s.status,
              COUNT(o.id)::int as orders, COALESCE(SUM(o.total), 0) as revenue
             FROM sessions s JOIN users u ON s.opened_by = u.id LEFT JOIN orders o ON o.session_id = s.id
             WHERE s.opened_at BETWEEN $1 AND $2 GROUP BY s.id, u.name ORDER BY s.opened_at DESC LIMIT 10`,
             [dateFrom, dateTo])
    ]);

    return res.json({
      success: true,
      data: {
        kpis: kpis.rows[0],
        sales_trend: salesTrend.rows,
        top_products: topProducts.rows,
        top_categories: topCategories.rows,
        payment_distribution: paymentDist.rows,
        employee_performance: employeePerf.rows,
        recent_orders: recentOrders.rows,
        session_summary: sessionSummary.rows
      }
    });
  } catch (error: any) {
    console.error('[REPORTS]', error);
    return res.status(500).json({ success: false, message: 'Failed to generate reports' });
  }
};

export const createCustomerOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { table_id, items, notes } = req.body;

    if (!items?.length) return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    if (!table_id) return res.status(400).json({ success: false, message: 'Table is required' });

    // Fetch customer profile for this user
    const customerResult = await query(`SELECT id FROM customers WHERE user_id = $1`, [req.user!.id]);
    const customerId = customerResult.rows[0]?.id || null;

    // Generate order number
    const count = await query(`SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE`);
    const orderNumber = `C-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Number(count.rows[0].count) + 1).padStart(4, '0')}`;

    // Fetch product prices
    const productIds = items.map((i: any) => i.product_id);
    const productsResult = await query(`SELECT * FROM products WHERE id = ANY($1)`, [productIds]);
    const productMap = new Map(productsResult.rows.map((p: any) => [p.id, p]));

    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = items.map((item: any) => {
      const product = productMap.get(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      const price = product.price;
      const lineTotal = price * item.quantity;
      const tax = (lineTotal * product.tax) / 100;
      subtotal += lineTotal;
      taxAmount += tax;
      return { ...item, price, line_total: lineTotal, tax: product.tax };
    });

    const total = subtotal + taxAmount;

    // Create order with status 'draft' and no employee_id
    const orderResult = await query(
      `INSERT INTO orders (order_number, table_id, customer_id, employee_id, status, subtotal, tax_amount, total, notes)
       VALUES ($1,$2,$3,NULL,'draft',$4,$5,$6,$7) RETURNING *`,
      [orderNumber, table_id, customerId, subtotal, taxAmount, total, notes]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of processedItems) {
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, tax, line_total, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, item.product_id, item.quantity, item.price, item.tax, item.line_total, item.notes]
      );
    }

    // Set table status to 'occupied'
    await query(`UPDATE tables SET status = 'occupied' WHERE id = $1`, [table_id]);
    io?.emit('table:status_changed', { table_id, status: 'occupied' });

    // Emit order created socket notification
    io?.emit('order:created', { order_id: order.id, order_number: orderNumber });

    return res.status(201).json({
      success: true,
      data: { ...order, items: processedItems },
      message: 'Order placed successfully. Waiting for cashier confirmation.'
    });
  } catch (error: any) {
    console.error('[CUSTOMER ORDER] Create error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to place order' });
  }
};

