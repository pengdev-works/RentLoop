import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ItemsPage } from './pages/ItemsPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { RenterDashboard } from './pages/RenterDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { RentalDetailPage } from './pages/RentalDetailPage';
import { AdminDashboard } from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function MarketplaceLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Dedicated Full-Screen Admin Portal (True Full-Height Sidebar Layout) */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Standard Marketplace Pages with Consumer Navbar and Footer */}
            <Route
              path="*"
              element={
                <MarketplaceLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/items" element={<ItemsPage />} />
                    <Route path="/items/:id" element={<ItemDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/renter/dashboard"
                      element={
                        <ProtectedRoute>
                          <RenterDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/owner/dashboard"
                      element={
                        <ProtectedRoute>
                          <OwnerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/rentals/:id"
                      element={
                        <ProtectedRoute>
                          <RentalDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MarketplaceLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
