import React, { useState } from 'react';
import { downloadAppData, uploadAndImportData } from '../utils/dataSync';
import { useNotifications } from '../context/NotificationContext';

const DataSync: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const { addNotification } = useNotifications();

  const handleExport = () => {
    try {
      downloadAppData();
      addNotification('success', 'Datos exportados exitosamente');
    } catch (error) {
      addNotification('error', 'Error al exportar datos');
      console.error(error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await uploadAndImportData(file);
      addNotification('success', 'Datos importados exitosamente. Recarga la página para ver los cambios.');
      
      // Recargar la página después de 2 segundos para aplicar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      addNotification('error', `Error al importar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error(error);
    } finally {
      setIsImporting(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sincronización de Datos</h2>
      
      <div className="space-y-6">
        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Información</h3>
          <p className="text-blue-700 text-sm">
            Usa estas herramientas para transferir tus datos entre diferentes dispositivos.
            Los datos incluyen productos, usuarios, órdenes y configuraciones.
          </p>
        </div>

        {/* Exportar datos */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">📤 Exportar Datos</h3>
          <p className="text-gray-600 text-sm mb-4">
            Descarga un archivo con todos tus datos para transferirlos a otro dispositivo.
          </p>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar Respaldo
          </button>
        </div>

        {/* Importar datos */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">📥 Importar Datos</h3>
          <p className="text-gray-600 text-sm mb-4">
            Sube un archivo de respaldo para restaurar tus datos en este dispositivo.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Advertencia:</strong> Esto reemplazará todos los datos actuales.
              Se recomienda hacer un respaldo antes de importar.
            </p>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200
                ${
                  isImporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }
                text-white
              `}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Seleccionar Archivo
                </>
              )}
            </label>
          </div>
        </div>

        {/* Gestión de Credenciales */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">🔐 Gestión de Credenciales</h3>
          <p className="text-gray-600 text-sm mb-4">
            Administra las credenciales de acceso y configuraciones de seguridad.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2V5a2 2 0 00-2-2m0 0V3a2 2 0 00-2-2H9a2 2 0 00-2 2v0a2 2 0 00-2 2v2a2 2 0 002 2h6a2 2 0 002-2V7z" />
              </svg>
              {showCredentials ? 'Ocultar Credenciales' : 'Ver Credenciales'}
            </button>
            
            {showCredentials && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario Administrador
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="admin"
                      defaultValue="admin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
                      Actualizar
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
                      Generar Nueva
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">📋 Instrucciones</h3>
          <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside">
            <li>En el dispositivo origen: Haz clic en "Descargar Respaldo" para exportar tus datos.</li>
            <li>Transfiere el archivo descargado al dispositivo destino (email, USB, nube, etc.).</li>
            <li>En el dispositivo destino: Usa "Seleccionar Archivo" para importar los datos.</li>
            <li>La página se recargará automáticamente para aplicar los cambios.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DataSync;