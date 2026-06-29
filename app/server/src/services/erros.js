// Erros de domínio reconhecidos pelo error handler do index.js (mapeiam status HTTP).

export class ValidationError extends Error {
  constructor(message, detalhes = []) {
    super(message);
    this.name = 'ValidationError';
    this.detalhes = detalhes;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Não encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Conflito') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}
