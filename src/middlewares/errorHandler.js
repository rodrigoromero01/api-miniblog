// Middleware global de errores: todos los next(error) terminan acá
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Error interno del servidor";

  // errores que vienen de PostgreSQL (tienen un code)
  if (err.code === "23505") {
    statusCode = 409;
    message = "El email ya está registrado";
  } else if (err.code === "23503") {
    statusCode = 404;
    message = "El autor no existe";
  } else if (err.code === "22P02") {
    statusCode = 400;
    message = "Algún dato tiene un formato inválido";
  }

  // JSON mal escrito en el body
  if (err.type === "entity.parse.failed") {
    message = "El body no es un JSON válido";
  }

  console.error("❌ Error capturado:", {
    status: statusCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // si es un error 500 no muestro el mensaje real al cliente
  if (statusCode === 500) {
    message = "Error interno del servidor";
  }

  res.status(statusCode).json({ error: message, status: statusCode });
}

// Para rutas que no existen
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.path}`, status: 404 });
}
