import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Auth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ProductsPage from './pages/admin/Products';
import CategoriesPage from './pages/admin/Categories';
import FloorsPage from './pages/admin/Floors';
import EmployeesPage from './pages/admin/Employees';
import CustomersPage from './pages/admin/Customers';
import PaymentMethodsPage from './pages/admin/PaymentMethods';
import CouponsPromotionsPage from './pages/admin/CouponsPromotions';
import SessionsPage from './pages/admin/Sessions';
import ReportsPage from './pages/admin/Reports';
import SettingsPage from './pages/admin/Settings';

// POS & Kitchen
import POSTerminal from './pages/POSTerminal';
import KitchenDisplay from './pages/KitchenDisplay';

// Guards
const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (user?.role === 'kitchen') return <Navigate to="/kds" replace />;
    if (user?.role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(45,31,18,0.15)',
          },
          success: { iconTheme: { primary: '#3DAB6B', secondary: 'white' } },
          error: { iconTheme: { primary: '#D94F4F', secondary: 'white' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'employee']}><AdminLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="floors" element={<FloorsPage />} />
          <Route path="tables" element={<FloorsPage />} />
          <Route path="employees" element={<PrivateRoute allowedRoles={['admin']}><EmployeesPage /></PrivateRoute>} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="payment-methods" element={<PrivateRoute allowedRoles={['admin']}><PaymentMethodsPage /></PrivateRoute>} />
          <Route path="coupons" element={<CouponsPromotionsPage />} />
          <Route path="promotions" element={<CouponsPromotionsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<PrivateRoute allowedRoles={['admin']}><SettingsPage /></PrivateRoute>} />
        </Route>

        {/* POS Terminal */}
        <Route path="/pos" element={<PrivateRoute allowedRoles={['admin', 'employee']}><POSTerminal /></PrivateRoute>} />

        {/* Kitchen Display */}
        <Route path="/kds" element={<PrivateRoute allowedRoles={['admin', 'kitchen']}><KitchenDisplay /></PrivateRoute>} />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
