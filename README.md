# Sistema de Venta de Cuentas Digitales

Un sistema completo de e-commerce para la venta de cuentas digitales con gestión de inventario, usuarios y órdenes.

## 🚀 Características

- **Gestión de Productos**: Administración completa de productos y cuentas digitales
- **Sistema de Usuarios**: Registro, login y gestión de perfiles
- **Carrito de Compras**: Funcionalidad completa de e-commerce
- **Panel de Administración**: Dashboard completo para administradores
- **Sincronización de Datos**: Exportar/importar datos entre dispositivos
- **Gestión de Stock**: Control automático de inventario
- **Sistema de Órdenes**: Procesamiento y seguimiento de pedidos

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Navegador web moderno

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd project
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

## 🏗️ Construcción para Producción

1. **Generar build de producción**
   ```bash
   npm run build
   ```

2. **Previsualizar build**
   ```bash
   npm run preview
   ```

## 🌐 Despliegue

### Opción 1: Hostinger (Recomendado)

1. **Preparar archivos**
   - Ejecutar `npm run build`
   - Comprimir la carpeta `dist` en un archivo ZIP

2. **Subir a Hostinger**
   - Acceder al panel de control de Hostinger
   - Ir a "Administrador de archivos"
   - Subir y extraer el ZIP en la carpeta `public_html`
   - Asegurarse de que el archivo `.htaccess` esté presente

3. **Configurar .htaccess** (ya incluido)
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

### Opción 2: Netlify

1. **Conectar repositorio**
   - Crear cuenta en Netlify
   - Conectar con GitHub/GitLab
   - Seleccionar el repositorio

2. **Configurar build**
   - Build command: `npm run build`
   - Publish directory: `dist`

### Opción 3: Vercel

1. **Desplegar con Vercel CLI**
   ```bash
   npm install -g vercel
   vercel
   ```

## 📊 Base de Datos

La aplicación utiliza localStorage para almacenamiento local. Para producción se incluye:

- **Exportación completa**: Descarga Excel con 5 hojas:
  - Usuarios
  - Órdenes
  - Productos
  - Cuentas Disponibles
  - Cuentas Vendidas

- **Sincronización**: Sistema de exportar/importar datos JSON

## 👤 Usuarios por Defecto

### Administrador
- **Email**: admin@admin.com
- **Contraseña**: admin123

### Usuario de Prueba
- **Email**: user@test.com
- **Contraseña**: user123
- **Saldo**: $1000

## 🔧 Configuración

### Variables de Entorno (Opcional)

Crear archivo `.env` en la raíz:
```env
VITE_APP_NAME="Sistema de Ventas"
VITE_API_URL="https://tu-api.com"
```

### Personalización

1. **Logo**: Reemplazar `public/logo.jpeg`
2. **Colores**: Modificar `tailwind.config.js`
3. **Productos**: Editar `src/data/products.ts`

## 📱 Funcionalidades

### Para Usuarios
- Registro y login
- Navegación de productos
- Carrito de compras
- Historial de órdenes
- Visualización de credenciales compradas

### Para Administradores
- Dashboard con estadísticas
- Gestión de usuarios
- Gestión de productos
- Gestión de órdenes
- Descarga de base de datos
- Sincronización de datos

## 🔒 Seguridad

- Autenticación basada en roles
- Validación de formularios
- Protección de rutas
- Sanitización de datos

## 📈 Optimizaciones para Producción

- [x] Minificación de código
- [x] Optimización de imágenes
- [x] Lazy loading
- [x] Code splitting
- [x] PWA ready
- [x] SEO optimizado

## 🐛 Solución de Problemas

### Error de compilación
```bash
npm run build
# Si hay errores, revisar la consola
```

### Problemas de dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

### Datos no sincronizados
- Usar la función "Sincronización" en el panel de admin
- Exportar datos desde un dispositivo e importar en otro

## 📞 Soporte

Para soporte técnico:
1. Revisar la consola del navegador
2. Verificar logs del servidor
3. Contactar al desarrollador

## 📄 Licencia

Este proyecto es privado y propietario.

---

**¡Tu sistema está listo para producción!** 🎉