import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { Profile } from '../../domain/entities/Profile';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export class SupabaseProfileRepository implements IProfileRepository {
  constructor(private client: SupabaseClient<Database>) {}

  private mapToDomain(row: ProfileRow): Profile {
    return Profile.create({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      websiteUrl: row.website_url,
      socialLinks: row.social_links as Record<string, any>,
      isVerified: row.is_verified || false,
      followersCount: (row as any).followers_count || 0,
      followingCount: (row as any).following_count || 0,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    });
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async save(profile: Profile): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .insert({
        id: profile.id,
        username: profile.username,
        display_name: profile.displayName,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        website_url: profile.websiteUrl,
        social_links: profile.socialLinks,
        is_verified: profile.isVerified,
      });

    if (error) throw new Error(`Error guardando perfil: ${error.message}`);
  }

  async update(profile: Profile): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .update({
        username: profile.username,
        display_name: profile.displayName,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        website_url: profile.websiteUrl,
        social_links: profile.socialLinks,
        is_verified: profile.isVerified,
      })
      .eq('id', profile.id);

    if (error) throw new Error(`Error actualizando perfil: ${error.message}`);
  }

  async usernameExists(username: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }
}
