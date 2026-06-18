export interface ProfileProps {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  socialLinks?: Record<string, any>;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  followersCount?: number;
  followingCount?: number;
}

export class Profile {
  private constructor(private props: ProfileProps) {
    this.validateUsername(props.username);
  }

  public static create(props: ProfileProps): Profile {
    return new Profile({
      ...props,
      socialLinks: props.socialLinks || {},
      isVerified: props.isVerified || false,
      followersCount: props.followersCount || 0,
      followingCount: props.followingCount || 0,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    });
  }

  // Reglas de negocio del Dominio
  private validateUsername(username: string) {
    if (!username || username.trim().length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    if (username.length > 30) {
      throw new Error('El nombre de usuario no puede exceder los 30 caracteres.');
    }
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      throw new Error('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get username(): string { return this.props.username; }
  get displayName(): string | null | undefined { return this.props.displayName; }
  get bio(): string | null | undefined { return this.props.bio; }
  get avatarUrl(): string | null | undefined { return this.props.avatarUrl; }
  get websiteUrl(): string | null | undefined { return this.props.websiteUrl; }
  get socialLinks(): Record<string, any> { return this.props.socialLinks || {}; }
  get isVerified(): boolean { return this.props.isVerified || false; }
  get followersCount(): number { return this.props.followersCount || 0; }
  get followingCount(): number { return this.props.followingCount || 0; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
  get updatedAt(): Date { return this.props.updatedAt || new Date(); }

  // Métodos de mutación controlada (Dominio)
  public updateInfo(displayName: string | null, bio: string | null, websiteUrl: string | null, socialLinks: Record<string, any>) {
    this.props.displayName = displayName;
    this.props.bio = bio;
    this.props.websiteUrl = websiteUrl;
    this.props.socialLinks = socialLinks;
    this.props.updatedAt = new Date();
  }

  public updateAvatar(url: string | null) {
    this.props.avatarUrl = url;
    this.props.updatedAt = new Date();
  }
}
