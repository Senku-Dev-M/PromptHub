export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProfileNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`No se encontró el perfil de usuario asociado a: ${identifier}`);
  }
}

export class UsernameAlreadyExistsException extends DomainException {
  constructor(username: string) {
    super(`El nombre de usuario "${username}" ya está registrado.`);
  }
}

export class UnauthorizedProfileAccessException extends DomainException {
  constructor() {
    super('No tienes autorización para editar este perfil.');
  }
}
