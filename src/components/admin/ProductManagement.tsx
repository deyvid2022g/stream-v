import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { CreateProductDTO } from '../../types/product';
import { Product, ProductAccount } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

const ProductManagement = () => {
  const { products, loading, error, addProduct, updateProduct, deleteProduct, addProductAccount, deleteProductAccount, getAllAccounts } = useProducts();
  const { addNotification } = useNotifications();
  
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<Omit<CreateProductDTO, 'initialAccounts'>>({
    name: '',
    description: '',
    price: 0,
    category: 'streaming',
    image: '',
    stock: 0,
    duration: '30 días',
  });
  
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  const [newAccounts, setNewAccounts] = useState<Array<{ id?: string; email: string; password: string; isNew?: boolean }>>([{ email: '', password: '', isNew: true }]);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (error) {
      addNotification('error', error);
    }
  }, [error, addNotification]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({
          ...prev,
          image: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  const handleAccountChange = (index: number, field: 'email' | 'password', value: string) => {
    const updatedAccounts = [...newAccounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setNewAccounts(updatedAccounts);
  };

  const addAccountField = () => {
    setNewAccounts([...newAccounts, { email: '', password: '', isNew: true }]);
  };
  
  const startEditingAccount = (account: ProductAccount) => {
    setEditingAccountId(account.id);
    setNewAccounts(prev => [
      ...prev.filter(acc => !acc.isNew), // Keep only the new (empty) accounts
      {
        id: account.id,
        email: account.email,
        password: account.password,
        isNew: false
      },
      { email: '', password: '', isNew: true } // Add a new empty field
    ]);
  };
  
  const removeAccount = async (accountId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.')) {
      try {
        // Check if it's a new account that hasn't been saved yet
        const accountInState = newAccounts.find(acc => acc.id === accountId);
        
        if (accountInState && accountInState.isNew) {
          // Just remove it from the local state if it's new
          setNewAccounts(prev => prev.filter(acc => acc.id !== accountId));
        } else {
          // Otherwise, delete it from the backend
          await deleteProductAccount(accountId);
          // Also remove from local state
          setNewAccounts(prev => prev.filter(acc => acc.id !== accountId));
          addNotification('success', 'Cuenta eliminada correctamente');
        }
      } catch (err) {
        console.error('Error deleting account:', err);
        addNotification('error', 'Error al eliminar la cuenta');
      }
    }
  };

  const removeAccountField = (index: number) => {
    const updatedAccounts = newAccounts.filter((_, i) => i !== index);
    setNewAccounts(updatedAccounts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Filter out empty accounts and only process new accounts
      const validNewAccounts = newAccounts
        .filter(acc => acc.isNew && acc.email && acc.password)
        .map(({ email, password }) => ({ email, password }));
      
      if (editingProduct) {
        // Update existing product
        await updateProduct(editingProduct.id, formData);
        
        // Add only new accounts if any
        if (validNewAccounts.length > 0) {
          for (const account of validNewAccounts) {
            await addProductAccount(editingProduct.id, account);
          }
        }
        addNotification('success', 'Producto actualizado correctamente');
      } else {
        // Add new product
        const newProduct = await addProduct(formData);
        
        // Add all valid accounts to the new product
        const allValidAccounts = newAccounts
          .filter(acc => acc.email && acc.password)
          .map(({ email, password }) => ({ email, password }));
        
        if (newProduct && allValidAccounts.length > 0) {
          for (const account of allValidAccounts) {
            await addProductAccount(newProduct.id, account);
          }
        }
        addNotification('success', 'Producto agregado correctamente');
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'streaming',
        image: '',
        stock: 0,
        duration: '30 días',
      });
      setNewAccounts([{ email: '', password: '', isNew: true }]);
      setImagePreview('');
      setImageFile(null);
      setEditingProduct(null);
      setIsAddingProduct(false);
      setEditingAccountId(null);
    } catch (err) {
      addNotification('error', 'Error al guardar el producto');
      console.error('Error saving product:', err);
    }
  };

  const handleEdit = (product: Product): void => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      stock: product.stock || 0,
      duration: product.duration || '30 días',
    });
    
    // Set image preview if image exists
    if (product.image) {
      setImagePreview(product.image);
    } else {
      setImagePreview('');
      setImageFile(null);
    }
    
    // Set existing accounts for editing - Fixed logic
    const productAccounts = getAllAccounts(product.id);
    if (productAccounts && productAccounts.length > 0) {
      const existingAccounts = productAccounts
        .filter((acc: ProductAccount) => !acc.isSold)
        .map((acc: ProductAccount) => ({
          id: acc.id,
          email: acc.email,
          password: acc.password,
          isNew: false
        }));
      
      // Add existing accounts plus one empty field for new accounts
      setNewAccounts([...existingAccounts, { email: '', password: '', isNew: true }]);
    } else {
      setNewAccounts([{ email: '', password: '', isNew: true }]);
    }
    
    // Reset editing state
    setEditingAccountId(null);
    
    setIsAddingProduct(true);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        await deleteProduct(productId);
        addNotification('success', 'Producto eliminado correctamente');
      } catch (err) {
        addNotification('error', 'Error al eliminar el producto');
        console.error('Error deleting product:', err);
      }
    }
  };

  const toggleProductExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const togglePasswordVisibility = (accountId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando productos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Productos</h2>
        <button
          onClick={() => {
            setIsAddingProduct(true);
            setEditingProduct(null);
            setFormData({
              name: '',
              description: '',
              price: 0,
              category: 'streaming',
              image: '',
              stock: 0,
              duration: '30 días',
            });
            setNewAccounts([{ email: '', password: '' }]);
          }}
          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </button>
      </div>

      {isAddingProduct && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">
            {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                >
                  <option value="streaming">Streaming</option>
                  <option value="juegos">Juegos</option>
                  <option value="software">Software</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="30 días"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del producto</label>
                
                {imagePreview ? (
                  <div className="mt-1 flex items-center">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Vista previa de la imagen"
                        className="h-32 w-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="Eliminar imagen"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-yellow-600 hover:text-yellow-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-yellow-500"
                        >
                          <span>Subir una imagen</span>
                          <input
                            id="image-upload"
                            name="image-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">o arrástrala aquí</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF hasta 10MB
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">O ingresa una URL de imagen</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Cuentas</h4>
                <button
                  type="button"
                  onClick={addAccountField}
                  className="text-sm text-yellow-600 hover:text-yellow-700"
                >
                  + Agregar cuenta
                </button>
              </div>
              
              <div className="space-y-2">
                {newAccounts.map((account, index) => (
                  <div key={account.id || `new-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={account.email}
                        onChange={(e) => handleAccountChange(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        disabled={!account.isNew && account.id !== editingAccountId}
                      />
                    </div>
                    <div className="flex">
                      <div className="relative flex-1">
                        <input
                          type={showPassword[account.id || index] ? 'text' : 'password'}
                          placeholder="Contraseña"
                          value={account.password}
                          onChange={(e) => handleAccountChange(index, 'password', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          disabled={!account.isNew && account.id !== editingAccountId}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(account.id || `${index}`)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          disabled={!account.isNew && account.id !== editingAccountId}
                        >
                          {showPassword[account.id || index] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {newAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => account.isNew ? removeAccountField(index) : removeAccount(account.id!)}
                          className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
                        handleDelete(editingProduct.id);
                      }
                    }}
                    className="px-4 py-2 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    <Trash2 className="inline-block w-4 h-4 mr-1 -mt-1" />
                    Eliminar Producto
                  </button>
                )}
              </div>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    setNewAccounts([{ email: '', password: '' }]);
                    setImagePreview('');
                    setImageFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                >
                  {editingProduct ? 'Actualizar Producto' : 'Agregar Producto'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No hay productos registrados. Comienza agregando uno nuevo.
            </li>
          ) : (
            products.map((product) => (
              <li key={product.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 mr-4">
                      {product.image ? (
                        <img
                          className="h-16 w-16 rounded-md object-cover"
                          src={product.image}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500 text-center">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {product.category} • ${product.price.toFixed(2)} • {product.stock} en stock
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-yellow-600 hover:text-yellow-800"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => toggleProductExpand(product.id)}
                      className="p-2 text-gray-600 hover:text-gray-800"
                      title={expandedProduct === product.id ? 'Ocultar detalles' : 'Ver detalles'}
                    >
                      {expandedProduct === product.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedProduct === product.id && (
                  <div className="mt-4 pl-0 md:pl-20">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                      <p className="text-sm text-gray-600">{product.description || 'Sin descripción'}</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">Cuentas ({product.accounts?.length || 0})</h4>
                        <span className="text-sm text-gray-500">
                          {product.accounts?.filter(a => !a.isSold).length || 0} disponibles • {product.accounts?.filter(a => a.isSold).length || 0} vendidas
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        {!editingProduct && (
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              {product.accounts?.filter(a => !a.isSold).length || 0} disponibles • {product.accounts?.filter(a => a.isSold).length || 0} vendidas
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEdit(product)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                              <Plus className="-ml-0.5 mr-1 h-3 w-3" />
                              Agregar Cuenta
                            </button>
                          </div>
                        )}
                        
                        {product.accounts && product.accounts.length > 0 ? (
                          <div className="overflow-hidden border border-gray-200 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Correo
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contraseña
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                  </th>
                                  {!editingProduct && (
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Acciones
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {product.accounts?.map((account: ProductAccount) => (
                                  <tr key={account.id} className={account.isSold ? 'bg-gray-50' : ''}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {account.email}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex items-center">
                                        {showPassword[account.id] ? account.password : '••••••••'}
                                        <button
                                          type="button"
                                          onClick={() => togglePasswordVisibility(account.id)}
                                          className="ml-2 text-gray-400 hover:text-gray-600"
                                          disabled={account.isSold}
                                        >
                                          {showPassword[account.id] ? (
                                            <EyeOff className="h-4 w-4" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.isSold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {account.isSold ? 'Vendida' : 'Disponible'}
                                      </span>
                                      {account.isSold && account.orderId && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Orden: {account.orderId.substring(0, 8)}...
                                        </div>
                                      )}
                                    </td>
                                    {!editingProduct && !account.isSold && (
                                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                          <button
                                            onClick={() => startEditingAccount(account)}
                                            className="text-yellow-600 hover:text-yellow-900"
                                            title="Editar cuenta"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => removeAccount(account.id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Eliminar cuenta"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No hay cuentas registradas para este producto.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

// Export the component in a separate statement to fix Fast Refresh warning
export default ProductManagement;
