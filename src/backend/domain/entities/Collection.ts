export interface CollectionProps {
  id?: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublic?: boolean;
  resourcesCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Collection {
  private constructor(private props: CollectionProps) {
    this.validateName(props.name);
    if (!props.slug) {
      throw new Error('El slug es obligatorio.');
    }
  }

  public static create(props: CollectionProps): Collection {
    return new Collection({
      ...props,
      id: props.id || crypto.randomUUID(),
      isPublic: props.isPublic !== undefined ? props.isPublic : false,
      resourcesCount: props.resourcesCount || 0,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    });
  }

  private validateName(name: string) {
    if (!name || name.trim().length < 3) {
      throw new Error('El nombre de la colección debe tener al menos 3 caracteres.');
    }
    if (name.length > 100) {
      throw new Error('El nombre de la colección no puede exceder los 100 caracteres.');
    }
  }

  get id(): string { return this.props.id!; }
  get ownerId(): string { return this.props.ownerId; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get description(): string | null | undefined { return this.props.description; }
  get coverImageUrl(): string | null | undefined { return this.props.coverImageUrl; }
  get isPublic(): boolean { return this.props.isPublic || false; }
  get resourcesCount(): number { return this.props.resourcesCount || 0; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
  get updatedAt(): Date { return this.props.updatedAt || new Date(); }

  public updateInfo(name: string, description: string | null, coverImageUrl: string | null, isPublic: boolean) {
    this.validateName(name);
    this.props.name = name;
    this.props.description = description;
    this.props.coverImageUrl = coverImageUrl;
    this.props.isPublic = isPublic;
    this.props.updatedAt = new Date();
  }
}
