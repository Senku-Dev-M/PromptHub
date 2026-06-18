export interface CommentProps {
  id?: string;
  resourceId: string;
  authorId: string;
  parentId?: string | null;
  content: string;
  isEdited?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  authorProfile?: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

export class Comment {
  private constructor(private props: CommentProps) {
    this.validateContent(props.content);
  }

  public static create(props: CommentProps): Comment {
    return new Comment({
      ...props,
      parentId: props.parentId || null,
      isEdited: props.isEdited || false,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      authorProfile: props.authorProfile || null,
    });
  }

  private validateContent(content: string) {
    if (!content || content.trim().length === 0) {
      throw new Error('El comentario no puede estar vacío.');
    }
    if (content.length > 1000) {
      throw new Error('El comentario no puede exceder los 1000 caracteres.');
    }
  }

  get id(): string | undefined { return this.props.id; }
  get resourceId(): string { return this.props.resourceId; }
  get authorId(): string { return this.props.authorId; }
  get parentId(): string | null | undefined { return this.props.parentId; }
  get content(): string { return this.props.content; }
  get isEdited(): boolean { return this.props.isEdited || false; }
  get createdAt(): Date { return this.props.createdAt || new Date(); }
  get updatedAt(): Date { return this.props.updatedAt || new Date(); }
  get authorProfile() { return this.props.authorProfile; }

  public updateContent(newContent: string) {
    this.validateContent(newContent);
    this.props.content = newContent;
    this.props.isEdited = true;
    this.props.updatedAt = new Date();
  }
}
