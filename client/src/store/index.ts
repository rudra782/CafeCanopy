import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'kitchen' | 'customer';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'cafecanopy-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// POS Store
interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  tax: number;
  image_url?: string;
  category_color?: string;
  notes?: string;
}

interface POSState {
  cartItems: CartItem[];
  selectedTable: any | null;
  selectedCustomer: any | null;
  currentSession: any | null;
  currentOrderId: string | null;
  appliedCoupon: any | null;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  setTable: (table: any) => void;
  setCustomer: (customer: any) => void;
  setSession: (session: any) => void;
  setOrderId: (id: string | null) => void;
  setCoupon: (coupon: any) => void;
  cartSubtotal: () => number;
  cartTax: () => number;
  cartTotal: () => number;
}

export const usePOSStore = create<POSState>()((set, get) => ({
  cartItems: [],
  selectedTable: null,
  selectedCustomer: null,
  currentSession: null,
  currentOrderId: null,
  appliedCoupon: null,

  addItem: (item) => {
    set((state) => {
      const existing = state.cartItems.find(i => i.product_id === item.product_id);
      if (existing) {
        return {
          cartItems: state.cartItems.map(i =>
            i.product_id === item.product_id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { cartItems: [...state.cartItems, { ...item, quantity: 1 }] };
    });
  },

  removeItem: (product_id) =>
    set((state) => ({ cartItems: state.cartItems.filter(i => i.product_id !== product_id) })),

  updateQuantity: (product_id, quantity) =>
    set((state) => ({
      cartItems: quantity <= 0
        ? state.cartItems.filter(i => i.product_id !== product_id)
        : state.cartItems.map(i => i.product_id === product_id ? { ...i, quantity } : i),
    })),

  clearCart: () => set({ cartItems: [], selectedTable: null, selectedCustomer: null, appliedCoupon: null, currentOrderId: null }),

  setTable: (table) => set({ selectedTable: table }),
  setCustomer: (customer) => set({ selectedCustomer: customer }),
  setSession: (session) => set({ currentSession: session }),
  setOrderId: (id) => set({ currentOrderId: id }),
  setCoupon: (coupon) => set({ appliedCoupon: coupon }),

  cartSubtotal: () => {
    const items = get().cartItems;
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  cartTax: () => {
    const items = get().cartItems;
    return items.reduce((sum, i) => {
      const lineTotal = i.price * i.quantity;
      return sum + (lineTotal * i.tax) / 100;
    }, 0);
  },

  cartTotal: () => {
    const subtotal = get().cartSubtotal();
    const tax = get().cartTax();
    const coupon = get().appliedCoupon;
    const couponDiscount = coupon?.calculated_discount || 0;
    return Math.max(0, subtotal + tax - couponDiscount);
  },
}));
