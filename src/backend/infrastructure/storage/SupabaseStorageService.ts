import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { IStorageService, UploadFileResult } from '../../application/services/IStorageService';

export class SupabaseStorageService implements IStorageService {
  constructor(
    private client: SupabaseClient<Database>,
    private defaultBucket: string = 'resource-attachments'
  ) {}

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    bucketName?: string
  ): Promise<UploadFileResult> {
    const bucket = bucketName || this.defaultBucket;
    
    // Generar un nombre de archivo único para evitar colisiones
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^\w.-]/g, '');
    const filePath = `${timestamp}_${cleanFileName}`;

    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Error al subir archivo a Supabase Storage: ${error.message}`);
    }

    // Obtener URL pública
    const { data: publicUrlData } = this.client.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('No se pudo generar la URL pública para el archivo subido.');
    }

    return {
      fileUrl: publicUrlData.publicUrl,
      fileType: mimeType,
      fileSize: fileBuffer.length,
    };
  }
}
