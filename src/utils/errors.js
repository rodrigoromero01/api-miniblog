// Crea un Error con un statusCode para que lo use el errorHandler
export function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const badRequest = (msg) => createError(msg, 400);
export const notFound = (msg) => createError(msg, 404);
export const conflict = (msg) => createError(msg, 409);
export const internalError = (msg = "Error interno del servidor") => createError(msg, 500);
