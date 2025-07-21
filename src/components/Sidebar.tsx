import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Store, User, ShoppingCart, HelpCircle, DollarSign, LogOut, Shield, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface SidebarProps {
  activeSection: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection }) => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = getItemCount();

  const handleLoadBalance = () => {
    const message = `Hola, quiero cargar saldo a mi cuenta de Arkion. Mi email es: ${user?.email}`;
    const whatsappUrl = `https://wa.me/573181394093?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const menuItems = [
    { id: 'store', label: 'TIENDA', icon: Store, path: '/store' },
    { id: 'account', label: 'MI CUENTA', icon: User, path: '/account' },
    { id: 'cart', label: 'CARRITO', icon: ShoppingCart, path: '/cart', badge: itemCount },
    { id: 'support', label: 'SOPORTE', icon: HelpCircle, path: '/support' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'ADMIN', icon: Shield, path: '/admin' });
  }

  const handleMenuClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-700 flex justify-center">
        <Link to="/store" className="flex items-center">
          <img 
            src="/WhatsApp Image 2025-07-17 at 11.54.47 AM.jpeg" 
            alt="ARKION Logo" 
            className="h-16 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Search Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full bg-gray-800 text-white rounded-lg px-10 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="px-6 py-4">
        <nav className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={(e) => handleMenuClick(e, item.path)}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  location.pathname.startsWith(item.path) && item.path !== '/store' || 
                  (item.path === '/store' && location.pathname === '/') ||
                  (item.path === '/store' && location.pathname === '/store')
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm tracking-wide">
                    {item.label}
                  </span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Balance Section - Reducido el espacio */}
      <div className="px-6 py-4 border-t border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="w-5 h-5 text-yellow-400" />
          <span className="text-gray-300">Saldo: ${user?.balance?.toLocaleString() || 0}</span>
        </div>
        
        <button
          onClick={handleLoadBalance}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <DollarSign className="w-5 h-5" />
          <span>CARGAR SALDO</span>
        </button>
      </div>

      {/* Contact & User Info */}
      <div className="px-6 py-4 border-t border-gray-700 mt-auto">
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-1">ESCRÍBENOS AHORA</p>
          <p className="text-yellow-400 font-semibold">+57 318 1394093</p>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Bienvenido</p>
              <p className="text-white font-medium">{user?.name}</p>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">SALIR</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-gray-900 text-white p-2 rounded-lg shadow-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Made fixed */}
      <div className="hidden lg:flex fixed top-0 left-0 h-screen bg-gray-900 text-white w-80 flex-col z-40">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </div>
      
      {/* Add padding to main content on desktop to account for fixed sidebar */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 1024px) {
            body {
              padding-left: 20rem; /* 80rem (320px) - 1rem for spacing */
            }
          }
        `
      }} />
    </>
  );
};

export default Sidebar;