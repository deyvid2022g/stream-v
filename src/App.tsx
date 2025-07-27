import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProductProvider } from './context/ProductContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Store from './components/Store';
import ProductDetail from './components/ProductDetail';
import Account from './components/Account';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Support from './components/Support';
import Admin from './components/Admin';
import NotificationToast from './components/NotificationToast';

const AppContent: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              <AppRoutes />
              <NotificationToast />
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Navigate to="/store" replace />} />
        <Route path="/store" element={<Store />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/account" element={<Account />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/support" element={<Support />} />
        <Route 
          path="/admin" 
          element={<Admin />} 
        />
      </Route>
      
      {/* 404 route */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-xl">Página no encontrada</p>
            <button 
              onClick={() => window.history.back()}
              className="mt-6 px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Volver atrás
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;