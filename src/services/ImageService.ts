import { supabase } from '../lib/supabase';

class ImageService {
  private static readonly BUCKET_NAME = 'product-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Valida que el archivo sea una imagen válida y no exceda el tamaño máximo
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    // Validar tamaño
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `La imagen excede el tamaño máximo permitido de ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Validar tipo
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato de imagen no válido. Se permiten JPG, PNG, WebP y GIF'
      };
    }

    return { valid: true };
  }

  /**
   * Sube una imagen de producto a Supabase Storage
   */
  static async uploadProductImage(file: File, productId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Validar imagen
      const validation = this.validateImage(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
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
}

export default ImageService;