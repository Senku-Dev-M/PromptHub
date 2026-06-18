export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ResourceNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`El recurso con identificador '${identifier}' no fue encontrado.`);
  }
}

export class UnauthorizedResourceAccessException extends DomainException {
  constructor() {
    super('No tiene permisos para modificar o eliminar este recurso.');
  }
}

export class CategoryNotFoundException extends DomainException {
  constructor(id: string) {
    super(`La categoría con ID '${id}' no existe.`);
  }
}
