import { createClient } from '@/lib/supabase/server';
import { SupabaseStorageService } from '@/backend/infrastructure/storage/SupabaseStorageService';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Debe iniciar sesión para realizar esta acción.',
      },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || undefined;

    if (!file) {
      return Response.json({
        data: null,
        error: {
          code: 'BAD_REQUEST',
          message: 'No se encontró ningún archivo en la petición.',
        },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadBuffer: any = buffer;
    let uploadMimeType = file.type;
    let uploadFileName = file.name;

    // Si es una imagen, la optimizamos con sharp (redimensionar a un ancho máx. de 1200px y convertir a WebP 80% calidad)
    if (file.type.startsWith('image/')) {
      try {
        const { default: sharp } = await import('sharp');
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
        let pipeline = image;
        if (metadata.width && metadata.width > 1200) {
          pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
        }
        
        uploadBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
        uploadMimeType = 'image/webp';
        
        // Cambiar la extensión del archivo a .webp
        const nameParts = file.name.split('.');
        if (nameParts.length > 1) {
          nameParts.pop();
        }
        uploadFileName = `${nameParts.join('.')}.webp`;
      } catch (err) {
        console.error('Error al optimizar la imagen con sharp, se subirá original:', err);
      }
    }

    // Inicializar adaptador de almacenamiento con el cliente de supabase del usuario (respeta RLS)
    const storageService = new SupabaseStorageService(supabase);
    const result = await storageService.uploadFile(
      uploadBuffer,
      uploadFileName,
      uploadMimeType,
      bucket
    );

    return Response.json({
      data: result,
      error: null,
      meta: { timestamp: new Date().toISOString() }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Storage Upload Error:', error);
    return Response.json({
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Error al procesar la subida del archivo.',
      },
      meta: { timestamp: new Date().toISOString() }
    }, { status: 500 });
  }
}
