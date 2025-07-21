# Guía de Despliegue en Hostinger

## Problema Resuelto: Logo no aparece

El problema del logo que no aparecía en Hostinger se ha solucionado mediante los siguientes cambios:

### 1. Configuración de Vite actualizada
- Se agregó `base: './'` para usar rutas relativas
- Se configuró correctamente el directorio de assets
- Se optimizó la generación de archivos para producción

### 2. Archivos de logo organizados
- El archivo `WhatsApp Image 2025-07-17 at 11.54.47 AM.jpeg` se movió a la carpeta `public/`
- Ahora se incluye automáticamente en el build de producción

## Instrucciones de Despliegue

### Paso 1: Generar build de producción
```bash
npm run build
```

### Paso 2: Subir archivos a Hostinger
1. Accede al panel de control de Hostinger
2. Ve a "Administrador de archivos" o usa FTP
3. Navega a la carpeta `public_html` (o la carpeta raíz de tu dominio)
4. Sube TODOS los archivos de la carpeta `dist/` a la carpeta raíz del hosting

### Paso 3: Verificar estructura de archivos en Hostinger
Asegúrate de que la estructura sea:
```
public_html/
├── WhatsApp Image 2025-07-17 at 11.54.47 AM.jpeg
├── assets/
│   ├── images/
│   ├── index-[hash].css
│   └── index-[hash].js
├── index.html
└── logo.jpeg
```

## Configuraciones Importantes

### Archivo .htaccess (Recomendado)
Crea un archivo `.htaccess` en la carpeta raíz con el siguiente contenido:

```apache
RewriteEngine On
RewriteBase /

# Handle Angular and React Router
RewriteRule ^(?!.*\.).*$ /index.html [L]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

### Verificación Post-Despliegue
1. Verifica que el logo aparezca correctamente
2. Prueba la navegación entre páginas
3. Verifica que todas las imágenes se carguen
4. Prueba la funcionalidad de la aplicación

## Solución de Problemas Comunes

### Si el logo sigue sin aparecer:
1. Verifica que el archivo esté en la carpeta raíz del hosting
2. Comprueba los permisos del archivo (644 recomendado)
3. Verifica que no haya errores en la consola del navegador

### Si las rutas no funcionan:
1. Asegúrate de tener el archivo `.htaccess` configurado
2. Verifica que el hosting soporte URL rewriting

### Si hay errores de CORS:
1. Contacta al soporte de Hostinger para configurar headers CORS si es necesario

## Notas Adicionales
- Siempre usa `npm run build` antes de subir archivos
- No subas la carpeta `node_modules` al hosting
- Mantén una copia de seguridad de tu configuración
- Considera usar un dominio personalizado para mejor rendimiento

## Archivos que NO debes subir a Hostinger
- `node_modules/`
- `src/`
- `.git/`
- `package.json`
- `package-lock.json`
- Archivos de configuración de desarrollo

Solo sube el contenido de la carpeta `dist/` generada por el comando `npm run build`.