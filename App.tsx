
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/use-auth';
import { SettingsProvider } from './hooks/use-settings';
import { BookingProvider } from './hooks/use-booking';
import Layout from './components/Layout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Reservations from './pages/Reservations';
import AuthPage from './pages/Auth';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBookings from './pages/admin/Bookings';
import AdminCustomers from './pages/admin/Customers';
import AdminAvailability from './pages/admin/Availability';
import AdminSettings from './pages/admin/Settings';
import AdminTables from './pages/admin/Tables';

// Protected Route Component
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center text-gold-500">Loading...</div>;
  
  if (!user) return <Navigate to="/auth" replace />;
  
  // Allow admin, manager, and super_admin to access admin routes
  const allowedRoles = ['admin', 'manager', 'super_admin'];
  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <SettingsProvider>
        <AuthProvider>
          <BookingProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="menu" element={<Menu />} />
                <Route path="reservations" element={<Reservations />} />
                <Route path="auth" element={<AuthPage />} />
                {/* Catch-all redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="tables" element={<AdminTables />} />
                <Route path="availability" element={<AdminAvailability />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Routes>
          </BookingProvider>
        </AuthProvider>
      </SettingsProvider>
    </HashRouter>
  );
};

export default App;
