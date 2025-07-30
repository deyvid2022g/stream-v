# Guía de Funcionalidad: Edición de Productos - Panel de Administrador

## Ubicación de la Funcionalidad

La funcionalidad de **Editar Producto** se encuentra en el panel de administrador, específicamente en la sección **"Gestión de Productos"**.

### Cómo Acceder:
1. Inicia sesión como administrador
2. Ve al panel de administrador
3. Haz clic en la pestaña **"Productos"** (icono de paquete)
4. Aquí verás la lista completa de productos con opciones de edición

## Funcionalidades Disponibles

### 1. **Editar Producto Existente**
- **Ubicación**: Botón de edición (icono de lápiz) junto a cada producto
- **Acción**: Abre el formulario de edición con los datos actuales del producto

### 2. **Campos Editables**
Cuando editas un producto, puedes modificar:
- ✅ **Nombre del producto**
- ✅ **Descripción**
- ✅ **Precio** (con símbolo de moneda)
- ✅ **Categoría** (Streaming, Juegos, Software, Otro)
- ✅ **Imagen** (subida de archivo con vista previa)
- ✅ **Stock** (cantidad disponible)
- ✅ **Duración** (período de validez)

### 3. **Gestión de Cuentas del Producto**
Dentro de la edición de productos también puedes:
- ✅ **Agregar nuevas cuentas** (email y contraseña)
- ✅ **Editar cuentas existentes**
- ✅ **Eliminar cuentas** no vendidas
- ✅ **Ver estado de cuentas** (disponibles vs vendidas)
- ✅ **Mostrar/ocultar contraseñas** con botón de visibilidad

### 4. **Funciones Adicionales**
- ✅ **Eliminar producto completo** (con confirmación)
- ✅ **Vista expandida** para ver detalles y cuentas
- ✅ **Cancelar edición** sin guardar cambios
- ✅ **Validación de formularios** antes de guardar

## Flujo de Trabajo para Editar un Producto

### Paso 1: Acceder a la Edición
1. En la lista de productos, localiza el producto que deseas editar
2. Haz clic en el **icono de lápiz (Edit)** junto al producto
3. Se abrirá el formulario de edición con los datos actuales

### Paso 2: Modificar Información del Producto
1. **Información Básica**:
   - Modifica el nombre, descripción, precio, categoría
   - Ajusta el stock y duración según sea necesario

2. **Imagen del Producto**:
   - Haz clic en "Seleccionar imagen" para cambiar la imagen
   - Verás una vista previa de la nueva imagen
   - La imagen anterior se mantendrá si no seleccionas una nueva

### Paso 3: Gestionar Cuentas Asociadas
1. **Ver Cuentas Existentes**:
   - Las cuentas actuales aparecen en la lista
   - Puedes ver cuáles están disponibles y cuáles vendidas

2. **Agregar Nuevas Cuentas**:
   - Completa los campos de email y contraseña en las filas vacías
   - Haz clic en "Agregar otra cuenta" para más campos

3. **Editar Cuentas Existentes**:
   - Haz clic en el icono de edición junto a una cuenta
   - Modifica el email o contraseña según necesites

4. **Eliminar Cuentas**:
   - Solo puedes eliminar cuentas que no han sido vendidas
   - Haz clic en el icono de basura para eliminar

### Paso 4: Guardar o Cancelar
1. **Guardar Cambios**:
   - Haz clic en "Actualizar Producto"
   - Recibirás una notificación de confirmación

2. **Cancelar**:
   - Haz clic en "Cancelar" para descartar cambios
   - Regresarás a la vista de lista sin modificaciones

## Características Técnicas Implementadas

### Validaciones
- ✅ Campos obligatorios marcados y validados
- ✅ Validación de formato de email para cuentas
- ✅ Validación de números para precio y stock
- ✅ Prevención de eliminación de cuentas vendidas

### Interfaz de Usuario
- ✅ **Diseño responsivo** que funciona en móvil y desktop
- ✅ **Iconos intuitivos** para cada acción
- ✅ **Colores consistentes** con el tema de la aplicación
- ✅ **Feedback visual** con notificaciones de éxito/error
- ✅ **Vista previa de imágenes** antes de guardar

### Funcionalidades Avanzadas
- ✅ **Edición en línea** de cuentas existentes
- ✅ **Gestión de estado** para mostrar/ocultar contraseñas
- ✅ **Confirmaciones** antes de eliminar elementos
- ✅ **Manejo de errores** con mensajes informativos

## Casos de Uso Comunes

### 1. **Actualizar Precio de Producto**
- Edita el producto → Cambia el precio → Guarda
- El nuevo precio se aplicará inmediatamente

### 2. **Agregar Más Cuentas a un Producto Popular**
- Edita el producto → Agrega nuevas cuentas → Guarda
- Las nuevas cuentas estarán disponibles para venta

### 3. **Cambiar Imagen de Producto**
- Edita el producto → Selecciona nueva imagen → Guarda
- La imagen se actualizará en toda la aplicación

### 4. **Actualizar Información de Cuenta Incorrecta**
- Edita el producto → Edita la cuenta específica → Guarda
- Solo las cuentas no vendidas pueden modificarse

## Notas Importantes

⚠️ **Cuentas Vendidas**: Las cuentas que ya han sido vendidas no pueden editarse ni eliminarse para mantener la integridad de las órdenes.

⚠️ **Imágenes**: Las imágenes se almacenan como base64, asegúrate de usar imágenes de tamaño razonable para evitar problemas de rendimiento.

⚠️ **Stock**: El stock se actualiza automáticamente cuando se venden cuentas, pero puedes ajustarlo manualmente si es necesario.

✅ **Backup**: Todos los cambios se guardan inmediatamente en la base de datos Supabase.

## Solución de Problemas

### Si no puedes editar un producto:
1. Verifica que tengas permisos de administrador
2. Asegúrate de estar en la pestaña "Productos" correcta
3. Revisa que no haya errores en la consola del navegador

### Si las cuentas no se guardan:
1. Verifica que el email tenga formato válido
2. Asegúrate de que la contraseña no esté vacía
3. Confirma que la cuenta no esté marcada como vendida

### Si la imagen no se carga:
1. Verifica que el archivo sea una imagen válida
2. Asegúrate de que el tamaño no sea excesivo
3. Intenta con un formato diferente (JPG, PNG, etc.)

---

**La funcionalidad de edición de productos está completamente implementada y lista para usar. Todas las características mencionadas están funcionando correctamente en el sistema actual.**