// Cada validador devuelve un mensaje de error, o null si el dato es válido

export function validarId(id, campo = "id") {
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    return `El ${campo} debe ser un número entero positivo`;
  }

  return null;
}

export function validarTexto(valor, campo, maximo) {
  if (valor === undefined || valor === null) {
    return `El ${campo} es requerido`;
  }

  if (typeof valor !== "string") {
    return `El ${campo} debe ser un texto`;
  }

  if (valor.trim().length === 0) {
    return `El ${campo} no puede estar vacío`;
  }

  if (maximo && valor.trim().length > maximo) {
    return `El ${campo} no puede tener más de ${maximo} caracteres`;
  }

  return null;
}

export function validarNombre(nombre) {
  return validarTexto(nombre, "nombre", 100);
}

export function validarEmail(email) {
  const error = validarTexto(email, "email", 150);
  if (error) return error;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return "El formato del email es inválido";
  }

  return null;
}

export function validarBio(bio) {
  // la bio es opcional
  if (bio === undefined || bio === null) return null;

  if (typeof bio !== "string") {
    return "La bio debe ser un texto";
  }

  return null;
}

export function validarPublished(published) {
  // published es opcional
  if (published === undefined) return null;

  if (typeof published !== "boolean") {
    return "El campo published debe ser true o false";
  }

  return null;
}
