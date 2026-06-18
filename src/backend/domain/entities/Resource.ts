export type ResourceType = 'prompt_llm' | 'prompt_image' | 'prompt_video' | 'agent' | 'workflow' | 'other';
export type ResourceStatus = 'draft' | 'published' | 'archived' | 'flagged';

export interface ResourceFileProps {
  id?: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  sortOrder?: number;
}

export interface ResourceProps {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  description?: string | null;
  content: string;
  type: ResourceType;
  status: ResourceStatus;
  categoryId?: string | null;
  compatibleModels?: string[];
  exampleInput?: string | null;
  exampleOutput?: string | null;
  metadata?: Record<string, any>;
  viewsCount?: number;
  likesCount?: number;
  savesCount?: number;
  commentsCount?: number;
  isFeatured?: boolean;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  files?: ResourceFileProps[];
}

export class Resource {
  private constructor(private props: ResourceProps) {
    this.validate();
  }

  public static create(props: ResourceProps): Resource {
    return new Resource({
      ...props,
      compatibleModels: props.compatibleModels || [],
      metadata: props.metadata || {},
      viewsCount: props.viewsCount || 0,
      likesCount: props.likesCount || 0,
      savesCount: props.savesCount || 0,
      commentsCount: props.commentsCount || 0,
      isFeatured: props.isFeatured || false,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      tags: props.tags || [],
      files: props.files || [],
    });
  }

  private validate() {
    if (!this.props.title || this.props.title.trim().length < 5) {
      throw new Error('El título debe tener al menos 5 caracteres.');
    }
    if (this.props.title.length > 200) {
      throw new Error('El título no puede exceder los 200 caracteres.');
    }
    if (!this.props.content || this.props.content.trim().length < 10) {
      throw new Error('El contenido principal del recurso debe tener al menos 10 caracteres.');
    }
    if (!this.props.slug) {
      throw new Error('El slug es obligatorio.');
    }
    if (this.props.tags && this.props.tags.length > 5) {
      throw new Error('Un recurso no puede tener más de 5 etiquetas.');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get authorId(): string { return this.props.authorId; }
  get title(): string { return this.props.title; }
  get slug(): string { return this.props.slug; }
  get description(): string | null | undefined { return this.props.description; }
  get content(): string { return this.props.content; }
  get type(): ResourceType { return this.props.type; }
  get status(): ResourceStatus { return this.props.status; }
  get categoryId(): string | null | undefined { return this.props.categoryId; }
  get compatibleModels(): string[] { return this.props.compatibleModels || []; }
  get exampleInput(): string | null | undefined { return this.props.exampleInput; }
  get exampleOutput(): string | null | undefined { return this.props.exampleOutput; }
  get metadata(): Record<string, any> { return this.props.metadata || {}; }
  get viewsCount(): number { return this.props.viewsCount || 0; }
  get likesCount(): number { return this.props.likesCount || 0; }
  get savesCount(): number { return this.props.savesCount || 0; }
  get commentsCount(): number { return this.props.commentsCount || 0; }
  get isFeatured(): boolean { return this.props.isFeatured || false; }
  get publishedAt(): Date | null | undefined { return this.props.publishedAt; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
  get updatedAt(): Date { return this.props.updatedAt || new Date(); }
  get tags(): string[] { return this.props.tags || []; }
  get files(): ResourceFileProps[] { return this.props.files || []; }

  // Setters y Mutadores de negocio
  public update(props: Partial<Pick<ResourceProps, 'title' | 'slug' | 'description' | 'content' | 'type' | 'status' | 'categoryId' | 'compatibleModels' | 'exampleInput' | 'exampleOutput' | 'metadata' | 'tags' | 'files'>>) {
    if (props.title !== undefined) this.props.title = props.title;
    if (props.slug !== undefined) this.props.slug = props.slug;
    if (props.description !== undefined) this.props.description = props.description;
    if (props.content !== undefined) this.props.content = props.content;
    if (props.type !== undefined) this.props.type = props.type;
    if (props.status !== undefined) {
      if (props.status === 'published' && this.props.status !== 'published') {
        this.props.publishedAt = new Date();
      }
      this.props.status = props.status;
    }
    if (props.categoryId !== undefined) this.props.categoryId = props.categoryId;
    if (props.compatibleModels !== undefined) this.props.compatibleModels = props.compatibleModels;
    if (props.exampleInput !== undefined) this.props.exampleInput = props.exampleInput;
    if (props.exampleOutput !== undefined) this.props.exampleOutput = props.exampleOutput;
    if (props.metadata !== undefined) this.props.metadata = props.metadata;
    if (props.tags !== undefined) this.props.tags = props.tags;
    if (props.files !== undefined) this.props.files = props.files;

    this.props.updatedAt = new Date();
    this.validate();
  }

  public publish() {
    this.props.status = 'published';
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public archive() {
    this.props.status = 'archived';
    this.props.updatedAt = new Date();
  }

  // Generación de slugs simple en dominio
  public static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
