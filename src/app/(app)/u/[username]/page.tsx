import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SupabaseProfileRepository } from '@/backend/infrastructure/supabase/SupabaseProfileRepository';
import { SupabaseResourceRepository } from '@/backend/infrastructure/supabase/SupabaseResourceRepository';
import { SupabaseFollowRepository } from '@/backend/infrastructure/supabase/SupabaseFollowRepository';
import { GetProfileUseCase } from '@/backend/application/use-cases/GetProfileUseCase';
import { ListResourcesUseCase } from '@/backend/application/use-cases/ListResourcesUseCase';
import Navbar from '@/components/layout/Navbar';
import FollowButton from '@/features/profile/components/FollowButton';
import ProfilePrompts from '@/features/profile/components/ProfilePrompts';
import { Globe, Calendar, Sparkles } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;

  // 1. Resolver dependencias del backend en el servidor
  const supabase = await createClient();
  const profileRepo = new SupabaseProfileRepository(supabase);
  const resourceRepo = new SupabaseResourceRepository(supabase);
  const followRepo = new SupabaseFollowRepository(supabase);

  const getProfileUseCase = new GetProfileUseCase(profileRepo);
  const listResourcesUseCase = new ListResourcesUseCase(resourceRepo);

  let profile;
  let resources = [];
  let totalResources = 0;
  let isFollowing = false;
  let currentUser = null;

  try {
    // 2. Obtener el perfil
    profile = await getProfileUseCase.execute({ username });

    // 3. Obtener prompts del autor
    const result = await listResourcesUseCase.execute({
      authorId: profile.id,
      status: 'published',
      limit: 100,
    });
    resources = result.resources;
    totalResources = result.total;

    // 4. Obtener usuario autenticado y comprobar estado de seguimiento
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;
    if (currentUser && currentUser.id !== profile.id) {
      isFollowing = await followRepo.exists(currentUser.id, profile.id);
    }
  } catch (error) {
    console.error('Error recuperando perfil público:', error);
    return notFound();
  }

  const socialLinks = profile.socialLinks || {};
  const formattedDate = new Date(profile.createdAt).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Cabecera del Perfil */}
        <section className="bg-zinc-900/30 border border-zinc-900 backdrop-blur-sm rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
          {/* Luz decorativa de fondo */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

          {/* Avatar */}
          <Avatar
            src={profile.avatarUrl}
            alt={profile.displayName || profile.username}
            size="lg"
          />

          {/* Info */}
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {profile.displayName || profile.username}
                  </h1>
                  {profile.isVerified && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold">
                      <Sparkles className="h-3 w-3" />
                      Creador Verificado
                    </span>
                  )}
                </div>
                {currentUser && currentUser.id !== profile.id && (
                  <FollowButton
                    followingUsername={profile.username}
                    initialFollowing={isFollowing}
                    hasUser={true}
                  />
                )}
              </div>
              <p className="text-zinc-400 text-sm font-medium">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="text-sm text-zinc-350 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Metadatos y Enlaces */}
            <div className="flex flex-wrap gap-x-6 gap-y-3.5 text-xs text-zinc-500 pt-2 border-t border-zinc-900/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-600" />
                Miembro desde {formattedDate}
              </span>

              <span className="flex items-center gap-1">
                <span className="font-bold text-zinc-200">{profile.followersCount}</span> seguidores
              </span>

              <span className="flex items-center gap-1">
                <span className="font-bold text-zinc-200">{profile.followingCount}</span> seguidos
              </span>

              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                >
                  <Globe className="h-4 w-4 text-zinc-650" />
                  {profile.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              )}

              {socialLinks.github && (
                <a
                  href={`https://github.com/${socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                >
                  <svg className="h-3.5 w-3.5 text-zinc-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  <span>GitHub</span>
                </a>
              )}

              {socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                >
                  <svg className="h-3.5 w-3.5 text-zinc-500 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Twitter</span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Sección de Prompts */}
        <section className="space-y-6">
          <div className="border-b border-zinc-900 pb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Prompts publicados</span>
              <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-450 border border-zinc-850 rounded-full text-xs font-semibold">
                {totalResources}
              </span>
            </h2>
          </div>

          {resources.length > 0 ? (
            <ProfilePrompts resources={resources} />
          ) : (
            <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-2xl">
              <p className="text-zinc-550 text-sm">Este creador aún no ha publicado ningún prompt.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
