import { useState } from 'react';
import { Mail, User, Lock, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/store';

  const handleWhatsAppSupport = () => {
    const message = 'Hola, necesito ayuda con mi cuenta de Arkion';
    const whatsappUrl = `https://wa.me/573181394093?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
    } else {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      const success = await register(email, password, name);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('El correo electrónico ya está registrado');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-center">
          <div className="w-40 h-20 flex items-center justify-center mx-auto mb-4">
          <img 
            src="/WhatsApp Image 2025-07-17 at 11.54.47 AM.jpeg" 
            alt="ARKION Logo" 
            className="h-full w-auto object-contain"
          />
        </div>
        <p className="text-black/80">Plataforma de Streaming</p>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                isLogin
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                !isLogin
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Nombre completo"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Email"
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Contraseña"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${isLoading ? 'bg-yellow-500' : 'bg-yellow-500 hover:bg-yellow-600'} focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2`}
            >
              {isLoading ? (
                'Cargando...'
              ) : isLogin ? (
                'Continuar con email'
              ) : (
                'Registrarse'
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6">
              <button
                onClick={handleWhatsAppSupport}
                className="w-full bg-green-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Soporte</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;