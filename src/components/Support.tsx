import React from 'react';
import { MessageCircle, Phone, Send, HelpCircle } from 'lucide-react';

const Support: React.FC = () => {
  const handleWhatsApp = () => {
    const message = 'Hola, necesito ayuda con mi cuenta de Arkion';
    const whatsappUrl = `https://wa.me/573181394093?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTelegram = () => {
    const telegramUrl = 'https://t.me/Givenxsoporte';
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Soporte</h1>
          <p className="text-gray-600">Estamos aquí para ayudarte</p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 mx-auto">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">WhatsApp</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Chatea con nosotros en WhatsApp para soporte inmediato
            </p>
            <button
              onClick={handleWhatsApp}
              className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Abrir WhatsApp
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">Teléfono</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Llámanos directamente para asistencia inmediata
            </p>
            <div className="text-center">
              <p className="font-bold text-blue-600">+57 318 1394093</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
              <Send className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">Telegram</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Contáctanos por Telegram para soporte rápido
            </p>
            <button
              onClick={handleTelegram}
              className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Abrir Telegram
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Preguntas Frecuentes
          </h3>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-800 mb-2">¿Cómo cargo saldo a mi cuenta?</h4>
              <p className="text-sm text-gray-600">
                Puedes cargar saldo haciendo clic en el botón "CARGAR SALDO" en la barra lateral y contactándonos por WhatsApp.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-800 mb-2">¿Cuánto tiempo toma recibir mis credenciales?</h4>
              <p className="text-sm text-gray-600">
                Las credenciales se entregan inmediatamente después de confirmar el pago, generalmente dentro de 5-10 minutos.
              </p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-800 mb-2">¿Qué hago si mis credenciales no funcionan?</h4>
              <p className="text-sm text-gray-600">
                Contáctanos inmediatamente por WhatsApp y te proporcionaremos nuevas credenciales o un reembolso completo.
              </p>
            </div>
            
            <div className="pb-4">
              <h4 className="font-medium text-gray-800 mb-2">¿Puedo cancelar mi pedido?</h4>
              <p className="text-sm text-gray-600">
                Los pedidos se pueden cancelar antes de que se entreguen las credenciales. Contáctanos lo antes posible.
              </p>
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

export default Support;