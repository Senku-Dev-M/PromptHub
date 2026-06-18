import { ListCategoriesUseCase } from '../../application/use-cases/ListCategoriesUseCase';

export class CategoryController {
  constructor(private listCategoriesUseCase: ListCategoriesUseCase) {}

  async listAll(): Promise<Response> {
    try {
      const categories = await this.listCategoriesUseCase.execute();
      
      return Response.json({
        data: categories,
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 200 });
    } catch (error: any) {
      console.error('Category API Error:', error);
      return Response.json({
        data: null,
        error: { 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error.message || 'Ocurrió un error inesperado al listar categorías.' 
        },
        meta: { timestamp: new Date().toISOString() }
      }, { status: 500 });
    }
  }
}
