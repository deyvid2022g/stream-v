# Implementación de Supabase Storage para Imágenes

## Guía Paso a Paso para Migrar a Supabase Storage

### 📋 **Requisitos Previos**
- ✅ Proyecto Supabase configurado
- ✅ Variables de entorno configuradas
- ✅ Acceso al Dashboard de Supabase

## Paso 1: Configurar Storage en Supabase

### 1.1 Crear Bucket
```sql
-- Ejecutar en Supabase Dashboard > Storage > Buckets
-- O en SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);
```

### 1.2 Configurar Políticas de Acceso
```sql
-- Política para permitir subida de imágenes (solo admins)
CREATE POLICY "Admins can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND
  auth.jwt() ->> 'email' IN (
    SELECT email FROM users WHERE is_admin = true
  )
);

-- Política para acceso público de lectura
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Política para que admins puedan eliminar
CREATE POLICY "Admins can delete product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' AND
  auth.jwt() ->> 'email' IN (
    SELECT email FROM users WHERE is_admin = true
  )
);
```

## Paso 2: Crear Servicio de Imágenes

### 2.1 Crear archivo `src/services/imageService.ts`
```typescript
import { supabase } from '../lib/supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageService {
  private static readonly BUCKET_NAME = 'product-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Valida si el archivo es una imagen válida
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No se seleccionó ningún archivo' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'El archivo es demasiado grande (máximo 5MB)' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF' };
    }

    return { valid: true };
  }

  /**
   * Sube una imagen de producto a Supabase Storage
   */
  static async uploadProductImage(
    file: File, 
    productId: string,
    oldImageUrl?: string
  ): Promise<ImageUploadResult> {
    try {
      // Validar archivo
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Eliminar imagen anterior si existe
      if (oldImageUrl && oldImageUrl.includes('supabase')) {
        await this.deleteProductImage(oldImageUrl);
      }

      // Generar nombre único
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Subir archivo
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading to storage:', error);
        return { success: false, error: 'Error al subir la imagen' };
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error in uploadProductImage:', error);
      return { success: false, error: 'Error inesperado al subir la imagen' };
    }
  }

  /**
   * Elimina una imagen de producto de Supabase Storage
   */
  static async deleteProductImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl || !imageUrl.includes('supabase')) {
        return true; // No es una imagen de Storage, no hay nada que eliminar
      }

      // Extraer el path del URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.BUCKET_NAME);
      
      if (bucketIndex === -1) {
        return false;
      }

      const path = urlParts.slice(bucketIndex + 1).join('/');
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Error deleting from storage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProductImage:', error);
      return false;
    }
  }

  /**
   * Comprime una imagen antes de subirla
   */
  static async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspecto
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback al archivo original
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Migra una imagen base64 a Supabase Storage
   */
  static async migrateBase64ToStorage(
    base64Data: string, 
    productId: string, 
    fileName: string = 'migrated-image.jpg'
  ): Promise<ImageUploadResult> {
    try {
      // Convertir base64 a blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      // Subir usando el método normal
      return await this.uploadProductImage(file, productId);
    } catch (error) {
      console.error('Error migrating base64 to storage:', error);
      return { success: false, error: 'Error al migrar la imagen' };
    }
  }
}

export default ImageService;
```

## Paso 3: Actualizar ProductManagement

### 3.1 Modificar `src/components/admin/ProductManagement.tsx`
```typescript
// Agregar import
import ImageService, { ImageUploadResult } from '../../services/imageService';

// Agregar estado para loading
const [isUploadingImage, setIsUploadingImage] = useState(false);

// Modificar handleImageChange
const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validar archivo
  const validation = ImageService.validateImageFile(file);
  if (!validation.valid) {
    addNotification('error', validation.error || 'Archivo inválido');
    return;
  }

  setImageFile(file);
  
  // Vista previa local
  const reader = new FileReader();
  reader.onloadend = () => {
    setImagePreview(reader.result as string);
  };
  reader.readAsDataURL(file);
};

// Modificar handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    let finalImageUrl = formData.image;
    
    // Si hay nueva imagen, subirla a Storage
    if (imageFile) {
      setIsUploadingImage(true);
      
      // Comprimir imagen si es muy grande
      const fileToUpload = imageFile.size > 1024 * 1024 
        ? await ImageService.compressImage(imageFile)
        : imageFile;
      
      const uploadResult = await ImageService.uploadProductImage(
        fileToUpload,
        editingProduct?.id || `temp-${Date.now()}`,
        editingProduct?.image // URL anterior para eliminar
      );
      
      if (uploadResult.success && uploadResult.url) {
        finalImageUrl = uploadResult.url;
      } else {
        addNotification('error', uploadResult.error || 'Error al subir la imagen');
        return;
      }
      
      setIsUploadingImage(false);
    }
    
    const productData = {
      ...formData,
      image: finalImageUrl
    };
    
    // Continuar con la lógica existente de guardado...
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await createProduct(productData);
    }
    
    // Reset form...
    
  } catch (error) {
    console.error('Error saving product:', error);
    addNotification('error', 'Error al guardar el producto');
  } finally {
    setLoading(false);
    setIsUploadingImage(false);
  }
};

// Actualizar el JSX del botón de submit
<button
  type="submit"
  disabled={loading || isUploadingImage}
  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Guardando...' : isUploadingImage ? 'Subiendo imagen...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
</button>
```

## Paso 4: Script de Migración (Opcional)

### 4.1 Crear `scripts/migrate-images.js`
```javascript
// Script para migrar imágenes base64 existentes a Supabase Storage
import { createClient } from '@supabase/supabase-js';
import ImageService from '../src/services/imageService.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function migrateImages() {
  try {
    console.log('Iniciando migración de imágenes...');
    
    // Obtener productos con imágenes base64
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, image')
      .like('image', 'data:image%'); // Solo imágenes base64
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`Encontrados ${products.length} productos con imágenes base64`);
    
    for (const product of products) {
      console.log(`Migrando imagen para: ${product.name}`);
      
      const result = await ImageService.migrateBase64ToStorage(
        product.image,
        product.id,
        `${product.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.jpg`
      );
      
      if (result.success && result.url) {
        // Actualizar URL en base de datos
        const { error: updateError } = await supabase
          .from('products')
          .update({ image: result.url })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError);
        } else {
          console.log(`✅ Migrado: ${product.name}`);
        }
      } else {
        console.error(`❌ Error migrando ${product.name}:`, result.error);
      }
      
      // Pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Migración completada');
  } catch (error) {
    console.error('Error en migración:', error);
  }
}

// Ejecutar migración
migrateImages();
```

## Paso 5: Configuración de Desarrollo

### 5.1 Actualizar `.env.example`
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Storage Configuration (opcional)
VITE_MAX_IMAGE_SIZE=5242880
VITE_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
```

### 5.2 Agregar scripts en `package.json`
```json
{
  "scripts": {
    "migrate:images": "node scripts/migrate-images.js",
    "storage:setup": "node scripts/setup-storage.js"
  }
}
```

## Ventajas de la Implementación

### 🚀 **Beneficios**
- **Rendimiento**: Consultas más rápidas sin datos base64
- **Escalabilidad**: Soporte para imágenes grandes
- **CDN**: Distribución global automática
- **Optimización**: Compresión automática
- **Gestión**: Fácil administración de archivos

### 📊 **Comparación**

| Característica | Base64 (Actual) | Supabase Storage |
|---|---|---|
| Simplicidad | ✅ Muy simple | ⚠️ Configuración inicial |
| Rendimiento | ⚠️ Lento con imágenes grandes | ✅ Rápido |
| Escalabilidad | ❌ Limitado | ✅ Ilimitado |
| Costo | ✅ Incluido en BD | ⚠️ Costo adicional |
| Backup | ✅ Automático | ✅ Automático |
| CDN | ❌ No | ✅ Sí |

## Recomendación de Implementación

### 📋 **Cuándo Migrar**
- Más de 50 productos con imágenes
- Imágenes mayores a 500KB
- Problemas de rendimiento
- Necesidad de múltiples imágenes por producto

### 🎯 **Estrategia Recomendada**
1. **Mantener sistema actual** para operación diaria
2. **Implementar Storage** como opción adicional
3. **Migrar gradualmente** productos nuevos
4. **Evaluar rendimiento** antes de migración completa

## Conclusión

Esta implementación proporciona una **migración gradual y segura** hacia Supabase Storage, manteniendo la funcionalidad existente mientras se prepara para mayor escalabilidad.

**El sistema actual funciona perfectamente** - esta mejora es para optimización futura.