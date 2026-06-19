import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import LocalTime from '@/components/ui/LocalTime';
import { SupabaseResourceRepository } from '@/backend/infrastructure/supabase/SupabaseResourceRepository';
import { SupabaseProfileRepository } from '@/backend/infrastructure/supabase/SupabaseProfileRepository';
import { SupabaseLikeRepository } from '@/backend/infrastructure/supabase/SupabaseLikeRepository';
import { SupabaseFollowRepository } from '@/backend/infrastructure/supabase/SupabaseFollowRepository';
import { GetResourceUseCase } from '@/backend/application/use-cases/GetResourceUseCase';
import Navbar from '@/components/layout/Navbar';
import CopyButton from '@/features/resources/components/CopyButton';
import DeleteButton from '@/features/resources/components/DeleteButton';
import ResourceLikeButton from '@/features/resources/components/ResourceLikeButton';
import ResourceSaveButton from '@/features/resources/components/ResourceSaveButton';
import FollowButton from '@/features/profile/components/FollowButton';
import CommentSection from '@/features/resources/components/CommentSection';
import Avatar from '@/components/ui/Avatar';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Box, 
  Eye, 
  Calendar, 
  User as UserIcon, 
  Edit, 
  ArrowLeft,
  ChevronRight,
  Terminal,
  FileCode
} from 'lucide-react';

interface ResourceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const typeLabels = {
  prompt_llm: 'Prompt LLM',
  prompt_image: 'Prompt Imagen',
  prompt_video: 'Prompt Video',
  agent: 'Agente IA',
  workflow: 'Workflow',
  other: 'Otro',
};

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const resourceRepo = new SupabaseResourceRepository(supabase);
  const profileRepo = new SupabaseProfileRepository(supabase);
  const likeRepo = new SupabaseLikeRepository(supabase);
  const followRepo = new SupabaseFollowRepository(supabase);
  const getResourceUseCase = new GetResourceUseCase(resourceRepo);

  let resource;
  let authorProfile = null;
  let currentUser = null;
  let isAuthor = false;
  let liked = false;
  let isFollowing = false;

  try {
    // 1. Obtener recurso
    resource = await getResourceUseCase.execute({ slug });

    // 2. Obtener creador del recurso
    authorProfile = await profileRepo.findById(resource.authorId);

    // 3. Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    isAuthor = currentUser !== null && currentUser.id === resource.authorId;

    // 4. Obtener estado de like y follow
    if (currentUser) {
      liked = await likeRepo.exists(currentUser.id, resource.id);
      if (authorProfile) {
        isFollowing = await followRepo.exists(currentUser.id, authorProfile.id);
      }
    }

    // 5. Registrar visualización (evitando spameo mediante hash de IP por 1 hora)
    try {
      const headersList = await headers();
      const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(ip);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentViews } = await supabase
        .from('resource_views')
        .select('id')
        .eq('resource_id', resource.id)
        .eq('ip_hash', ipHash)
        .gt('created_at', oneHourAgo)
        .limit(1);

      if (!recentViews || recentViews.length === 0) {
        await supabase
          .from('resource_views')
          .insert({
            resource_id: resource.id,
            viewer_id: currentUser?.id || null,
            ip_hash: ipHash,
          });
      }
    } catch (viewError) {
      console.error('Error al registrar visualización:', viewError);
    }
  } catch (error) {
    console.error('Error al recuperar detalle del recurso:', error);
    return notFound();
  }



  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Migas de pan y Acciones de Autor */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <Link href="/explore" className="hover:text-zinc-350 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Explorar</span>
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-400 truncate max-w-[200px]">{resource.title}</span>
          </div>

          {isAuthor && (
            <div className="flex items-center gap-3">
              <Link
                href={`/resource/edit/${resource.id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar</span>
              </Link>
              <DeleteButton id={resource.id} />
            </div>
          )}
        </div>

        {/* Encabezado Principal */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {resource.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-3.5 gap-x-6 text-xs text-zinc-400 font-medium">
            <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded-full text-zinc-300">
              {typeLabels[resource.type] || 'Prompt'}
            </span>

            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-zinc-600" />
              Publicado el <LocalTime date={resource.createdAt} format="long" />
            </span>

            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-zinc-600" />
              {resource.viewsCount} vistas
            </span>

            <div className="flex items-center gap-2">
              <ResourceLikeButton
                resourceId={resource.id}
                initialLikesCount={resource.likesCount}
                initialLiked={liked}
                hasUser={currentUser !== null}
              />
              <ResourceSaveButton
                resourceId={resource.id}
                hasUser={currentUser !== null}
              />
            </div>
          </div>

          {resource.description && (
            <p className="text-base text-zinc-400 leading-relaxed max-w-4xl">
              {resource.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Prompt y Ejemplos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Caja del Prompt */}
            <div className="border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm rounded-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 bg-zinc-900/30 border-b border-zinc-850 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-purple-400" />
                  El Prompt / Instrucciones
                </span>
                <CopyButton text={resource.content} />
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words text-zinc-150 leading-relaxed font-normal">
                  {resource.content}
                </pre>
              </div>
            </div>

            {/* Ejemplos */}
            {(resource.exampleInput || resource.exampleOutput) && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Ejemplo de uso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resource.exampleInput && (
                    <div className="border border-zinc-850 bg-zinc-950/40 rounded-2xl p-5 space-y-2.5">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">Entrada (Input)</span>
                      {resource.exampleInput.startsWith('http://') || resource.exampleInput.startsWith('https://') ? (
                        <div className="relative rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950/80 flex items-center justify-center p-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resource.exampleInput}
                            alt="Ejemplo de entrada"
                            className="max-h-96 w-full object-contain mx-auto rounded-lg"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{resource.exampleInput}</p>
                      )}
                    </div>
                  )}
                  {resource.exampleOutput && (
                    <div className="border border-zinc-850 bg-zinc-950/40 rounded-2xl p-5 space-y-2.5">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block">Salida (Output)</span>
                      {resource.exampleOutput.startsWith('http://') || resource.exampleOutput.startsWith('https://') ? (
                        <div className="relative rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950/80 flex items-center justify-center p-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resource.exampleOutput}
                            alt="Ejemplo de salida"
                            className="max-h-96 w-full object-contain mx-auto rounded-lg"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">{resource.exampleOutput}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Metadatos del Prompt, Imagenes, e Info Creador */}
          <div className="space-y-6">
            {/* Caja del Creador */}
            {authorProfile && (
              <div className="border border-zinc-900 bg-zinc-900/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">Creador</h3>
                <div className="flex items-center gap-3">
                  <Link href={`/u/${authorProfile.username}`}>
                    <Avatar
                      src={authorProfile.avatarUrl}
                      alt={authorProfile.displayName || authorProfile.username}
                      size="sm"
                      className="h-10 w-10"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/u/${authorProfile.username}`} className="text-sm font-bold text-white hover:text-purple-400 transition-colors truncate block">
                      {authorProfile.displayName || authorProfile.username}
                    </Link>
                    <p className="text-xs text-zinc-500 truncate">@{authorProfile.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                  <div>
                    <span className="font-bold text-zinc-200">{authorProfile.followersCount}</span> seguidores
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200">{authorProfile.followingCount}</span> seguidos
                  </div>
                </div>

                {!isAuthor && (
                  <div className="pt-2">
                    <FollowButton
                      followingUsername={authorProfile.username}
                      initialFollowing={isFollowing}
                      hasUser={currentUser !== null}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Caja de Detalles */}
            <div className="border border-zinc-900 bg-zinc-900/10 backdrop-blur-sm rounded-2xl p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">Detalles</h3>
              
              {/* Modelos compatibles */}
              {resource.compatibleModels.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Modelos compatibles</span>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.compatibleModels.map((model) => (
                      <span
                        key={model}
                        className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded-xl text-zinc-300 font-medium"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {resource.tags.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Etiquetas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 bg-purple-950/10 border border-purple-900/20 text-purple-400 rounded-xl font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Galería de adjuntos / Imagen de previsualización */}
            {resource.files.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Archivos / Imágenes de muestra</h3>
                <div className="space-y-4">
                  {resource.files.map((file) => (
                    <div
                      key={file.id || file.fileUrl}
                      className="border border-zinc-900 bg-zinc-950 rounded-2xl overflow-hidden relative flex items-center justify-center p-2"
                    >
                      {file.fileType?.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={file.fileUrl}
                          alt="Salida de muestra"
                          className="max-h-[500px] w-full object-contain rounded-xl"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-zinc-400 p-4 text-center">
                          <FileCode className="h-8 w-8 text-purple-400 animate-pulse" />
                          <span className="text-xs truncate max-w-[200px]">{file.fileUrl.split('/').pop()}</span>
                          <a
                            href={file.fileUrl}
                            download
                            className="text-[10px] text-purple-400 hover:underline mt-1"
                          >
                            Descargar archivo
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Comentarios */}
        <div className="border-t border-zinc-900 pt-10">
          <CommentSection resourceId={resource.id} />
        </div>
      </main>
    </div>
  );
}
