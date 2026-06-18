import { ICategoryRepository, CategoryDTO } from '../../domain/repositories/ICategoryRepository';

export class ListCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(): Promise<CategoryDTO[]> {
    return this.categoryRepository.listAll();
  }
}
