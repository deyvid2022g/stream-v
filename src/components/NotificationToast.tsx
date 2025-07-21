import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: string) => {
    const baseClasses = 'h-4 w-4 sm:h-5 sm:w-5';
    switch (type) {
      case 'success':
        return <CheckCircle className={`${baseClasses} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${baseClasses} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${baseClasses} text-yellow-500`} />;
      case 'info':
        return <Info className={`${baseClasses} text-blue-500`} />;
      default:
        return <Info className={`${baseClasses} text-blue-500`} />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-100';
      case 'error':
        return 'bg-red-50 border-red-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-100';
      case 'info':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-xs sm:max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative ${getBackgroundColor(notification.type)} border rounded-lg shadow-sm p-3 sm:p-4 animate-slide-in`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-800 leading-snug">
                {notification.message}
              </p>
            </div>
            <div className="ml-2">
              <button
                onClick={() => removeNotification(notification.id)}
                className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              >
                <span className="sr-only">Cerrar</span>
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;