import React, { useState, useEffect } from 'react';
import { Package, User, LogOut, Edit, Save, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { OrderWithItems } from '../services/orderService';
import { OrderItem } from '../types';
import { useNotifications } from '../context/NotificationContext';

const Account: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { orders, getOrdersByUser } = useOrders();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingCredentials, setViewingCredentials] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<OrderWithItems[]>([]);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (user?.id) {
      const userOrders = getOrdersByUser(user.id);
      setUserOrders(userOrders);
    }
  }, [user, orders, getOrdersByUser]);



  const hasAccounts = (item: OrderItem): boolean => {
    return 'accounts' in item && Array.isArray(item.accounts) && item.accounts.length > 0;
  };

  const handleSaveProfile = () => {
    if (!user) return;
    
    updateUserProfile(user.id, {
      username: editForm.username,
      email: editForm.email
    });
    
    setIsEditing(false);
    addNotification('success', 'Perfil actualizado correctamente');
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: user?.username || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  // Helper function to safely format dates
  const formatDate = (dateInput: Date | string | undefined): string => {
    if (!dateInput) return 'N/A';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return date instanceof Date && !isNaN(date.getTime()) 
        ? date.toLocaleDateString() 
        : 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'processing':
        return 'Procesando';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendiente';
    }
  };

  const accountOptions = [
    { 
      id: 'overview',
      icon: User, 
      title: 'RESUMEN', 
      description: 'Vista general de tu cuenta' 
    },
    { 
      id: 'orders',
      icon: Package, 
      title: 'PEDIDOS', 
      description: 'Ver historial de pedidos',
      badge: userOrders.length
    },
    { 
      id: 'profile',
      icon: User, 
      title: 'PERFIL', 
      description: 'Información personal' 
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Historial de Pedidos</h3>
            {userOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tienes pedidos aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.filter((order: OrderWithItems) => order && order.items && Array.isArray(order.items)).map((order: OrderWithItems) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">Orden #{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm font-medium">{getStatusText(order.status)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {order.items.map((item: OrderItem) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{(item.price * item.quantity).toFixed(0)} pts</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total: ${order.total.toLocaleString()}</span>
                        {order.status === 'completed' && order.items.some(item => hasAccounts(item) && item.accounts.length > 0) && (
                          <button 
                            onClick={() => setViewingCredentials(viewingCredentials === order.id ? null : order.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {viewingCredentials === order.id ? 'Ocultar credenciales' : 'Ver credenciales'}
                          </button>
                        )}
                      </div>
                      {viewingCredentials === order.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-gray-800 mb-2">Credenciales:</h4>
                          {order.items
                            .filter(hasAccounts)
                            .flatMap((item) => 
                              item.accounts.map((account, idx, accounts) => (
                                <React.Fragment key={`${item.id}-${account.id || idx}`}>
                                  <div className="text-sm text-gray-700 mb-2">
                                    <p><span className="font-medium">Producto:</span> {item.name}</p>
                                    <p><span className="font-medium">Email:</span> {account.email}</p>
                                    <p><span className="font-medium">Contraseña:</span> {account.password}</p>
                                  </div>
                                  {idx < accounts.length - 1 && <hr key={`hr-${item.id}-${account.id || idx}`} className="my-2 border-gray-200" />}
                                </React.Fragment>
                              ))
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Información del Perfil</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center space-x-2 text-green-600 hover:text-green-800"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.username}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{user?.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo</label>
                <p className="text-gray-900 font-semibold py-2">${user?.balance?.toLocaleString() || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cuenta</label>
                <p className="text-gray-900 capitalize py-2">{user?.is_admin ? 'Admin' : 'Usuario'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miembro desde</label>
                <p className="text-gray-900 py-2">{formatDate(user?.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total de pedidos</label>
                <p className="text-gray-900 py-2">{userOrders.length}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Resumen de la Cuenta</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Saldo Actual</p>
                    <p className="text-2xl font-bold text-blue-800">${user?.balance?.toLocaleString() || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Total Pedidos</p>
                    <p className="text-2xl font-bold text-green-800">{userOrders.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Completados</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {userOrders.filter(o => o.status === 'completed').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Pedidos Recientes</h4>
              {userOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-800">Orden #{order.id.slice(-6)}</p>
                    <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">${order.total.toLocaleString()}</p>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(order.status)}
                      <span className="text-sm">{getStatusText(order.status)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {userOrders.length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay pedidos recientes</p>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        {/* Header */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4 overflow-x-auto">
            <span>SHOP</span>
            <span className="text-gray-400">›</span>
            <span>MI CUENTA</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">MI CUENTA</h1>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Hola <span className="text-yellow-600">{user?.username}</span>
          </h2>
          <p className="text-gray-600">
            Desde el escritorio de tu cuenta puedes ver tus pedidos recientes, gestionar tus direcciones de envío y facturación y editar tu contraseña y los detalles de tu cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Account Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Navegación</h3>
              <nav className="space-y-2">
                {accountOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={`nav-item-${option.id}`}>
                      <button
                        onClick={() => setActiveTab(option.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                          activeTab === option.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{option.title}</span>
                        </div>
                        {option.badge && (
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {option.badge}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
                
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">SALIR</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>arkion © 2024. Todos los Derechos Reservados</p>
        </div>
      </div>
    </div>
  );
};

export default Account;