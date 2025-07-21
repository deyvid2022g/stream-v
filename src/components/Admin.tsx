import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useNotifications } from '../context/NotificationContext';

import { Users, DollarSign, CreditCard, TrendingUp, Search, Trash2, Package } from 'lucide-react';
import type { OrderStatus } from '../types/order';
import ProductManagement from './admin/ProductManagement';

const Admin: React.FC = () => {
  const { getAllUsers, updateUserBalance, deleteUser } = useAuth();
  const { getAllOrders, updateOrderStatus } = useOrders();
  const { addNotification } = useNotifications();
  
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('');
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');

  const users = getAllUsers();
  const orders = getAllOrders();
  const regularUsers = users.filter(user => user.role === 'user');

  const filteredUsers = regularUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(order => {
    const user = users.find(u => u.id === order.userId);
    return user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.id.includes(searchTerm);
  });

const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${userName}?`)) {
      deleteUser(userId);
      addNotification('success', `Usuario ${userName} eliminado exitosamente`);
    }
  };

  const handleRechargeBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;
    
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      addNotification('error', 'Por favor ingresa un monto válido');
      return;
    }
    
    const user = users.find(u => u.id === selectedUser);
    if (!user) return;
    
    const newBalance = (user.balance || 0) + amountNumber;
    updateUserBalance(selectedUser, newBalance);
    setAmount('');
    setSelectedUser('');
    setIsRechargeModalOpen(false);
    addNotification('success', `Saldo actualizado a $${newBalance.toFixed(2)} para ${user.name}`);
  };



  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    // Type assertion is safe here because we control the select options
    const orderStatus = status as OrderStatus;
    await updateOrderStatus(orderId, orderStatus);
    addNotification('success', `Estado de orden actualizado a ${orderStatus}`);
  };

  const renderProducts = () => <ProductManagement />;

  const totalUsers = regularUsers.length;
  const totalBalance = regularUsers.reduce((sum, user) => sum + user.balance, 0);
  const totalOrders = orders.length;
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, order) => sum + order.total, 0);

  const renderDashboard = () => (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Usuarios</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{totalUsers}</p>
            </div>
            <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Saldo Total</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">${totalBalance.toLocaleString()}</p>
            </div>
            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Órdenes</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{totalOrders}</p>
            </div>
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Ingresos</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Usuarios Recientes</h3>
          <div className="space-y-2 sm:space-y-3">
            {regularUsers.slice(0, 5).map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm sm:text-base font-semibold text-gray-800">${user.balance.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Órdenes Recientes</h3>
          <div className="space-y-2 sm:space-y-3">
            {orders.slice(0, 5).map(order => {
              const user = users.find(u => u.id === order.userId);
              return (
                <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">#{order.id.slice(-6)}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{user?.name || 'Usuario desconocido'}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm sm:text-base font-semibold text-gray-800">${order.total.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'completed' ? 'Completado' :
                       order.status === 'processing' ? 'Procesando' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row justify-between items-stretch sm:items-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Gestión de Usuarios</h3>
        <div className="w-full sm:w-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm sm:shadow-md overflow-hidden">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 hidden sm:table-header-group">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Registro</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 flex flex-col sm:table-row mb-4 sm:mb-0 last:mb-0 border border-gray-200 sm:border-none rounded-lg sm:rounded-none">
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full">
                        <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">${user.balance.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user.id);
                          setAmount('');
                          setIsRechargeModalOpen(true);
                        }}
                        className="p-1.5 sm:p-2 text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 rounded-full"
                        aria-label="Agregar saldo"
                      >
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(user.id, user.name);
                        }}
                        className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-full"
                        aria-label="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'processing': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed': return 'Completado';
        case 'processing': return 'Procesando';
        case 'cancelled': return 'Cancelado';
        default: return 'Pendiente';
      }
    };

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-800">Gestión de Órdenes</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar órdenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => {
                  const user = users.find(u => u.id === order.userId);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id.slice(-6)}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{user?.email}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">${order.total.toLocaleString()}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`text-sm px-3 py-1.5 rounded-full border-0 focus:ring-2 focus:ring-yellow-400 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="processing">Procesando</option>
                          <option value="completed">Completado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50">
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3">
          {filteredOrders.map(order => {
            const user = users.find(u => u.id === order.userId);
            return (
              <div key={order.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">#{order.id.slice(-6)}</span>
                      <span className={`px-2.5 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">${order.total.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                    className={`text-sm w-full max-w-[160px] px-3 py-1.5 rounded-full border-0 focus:ring-2 focus:ring-yellow-400 ${getStatusColor(order.status)}`}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="processing">Procesando</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <button className="text-sm text-blue-600 hover:text-blue-900 px-3 py-1.5 rounded hover:bg-blue-50">
                    Ver detalles
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron órdenes que coincidan con tu búsqueda.
            </div>
          )}
        </div>
      </div>
    );
  };

  // Balance management component has been removed as it's not being used
  
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Panel de Administración</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Órdenes
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-1" />
                Productos
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md overflow-hidden">
          <div className="p-3 sm:p-4 md:p-6">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'products' && renderProducts()}
          </div>
        </div>
      </div>

      {/* Modal de Recarga de Saldo */}
      {isRechargeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recargar Saldo</h3>
              <button 
                onClick={() => {
                  setIsRechargeModalOpen(false);
                  setSelectedUser('');
                  setAmount('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRechargeBalance}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  value={users.find(u => u.id === selectedUser)?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monto a Recargar
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsRechargeModalOpen(false);
                    setSelectedUser('');
                    setAmount('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 border border-transparent rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Aplicar Recarga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;