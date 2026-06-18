export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export interface ICategoryRepository {
  listAll(): Promise<CategoryDTO[]>;
  findById(id: string): Promise<CategoryDTO | null>;
}
