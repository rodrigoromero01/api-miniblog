import {
  createAuthorService,
  deleteAuthorService,
  getAllAuthorsService,
  getAuthorByIdService,
  updateAuthorService,
} from "../services/authorsService.js";
import { badRequest, notFound } from "../utils/errors.js";
import { validarBio, validarEmail, validarId, validarNombre } from "../utils/validators.js";

export const getAllAuthors = async (req, res, next) => {
  try {
    const authors = await getAllAuthorsService();
    res.status(200).json(authors);
  } catch (error) {
    next(error);
  }
};

export const getAuthorById = async (req, res, next) => {
  try {
    const errorId = validarId(req.params.id);
    if (errorId) return next(badRequest(errorId));

    const author = await getAuthorByIdService(req.params.id);
    if (!author) return next(notFound("Autor no encontrado"));

    res.status(200).json(author);
  } catch (error) {
    next(error);
  }
};

export const createAuthor = async (req, res, next) => {
  try {
    const { name, email, bio } = req.body || {};

    const errorNombre = validarNombre(name);
    if (errorNombre) return next(badRequest(errorNombre));

    const errorEmail = validarEmail(email);
    if (errorEmail) return next(badRequest(errorEmail));

    const errorBio = validarBio(bio);
    if (errorBio) return next(badRequest(errorBio));

    // si el email ya existe la base tira error 23505 y el errorHandler responde 409
    const newAuthor = await createAuthorService(name.trim(), email.trim(), bio);

    res.status(201).json(newAuthor);
  } catch (error) {
    next(error);
  }
};

export const updateAuthor = async (req, res, next) => {
  try {
    const errorId = validarId(req.params.id);
    if (errorId) return next(badRequest(errorId));

    const { name, email, bio } = req.body || {};

    // en el PUT los campos son opcionales, pero si vienen tienen que ser válidos
    if (name !== undefined) {
      const errorNombre = validarNombre(name);
      if (errorNombre) return next(badRequest(errorNombre));
    }

    if (email !== undefined) {
      const errorEmail = validarEmail(email);
      if (errorEmail) return next(badRequest(errorEmail));
    }

    const errorBio = validarBio(bio);
    if (errorBio) return next(badRequest(errorBio));

    const author = await updateAuthorService(req.params.id, name?.trim(), email?.trim(), bio);
    if (!author) return next(notFound("Autor no encontrado"));

    res.status(200).json(author);
  } catch (error) {
    next(error);
  }
};

export const deleteAuthor = async (req, res, next) => {
  try {
    const errorId = validarId(req.params.id);
    if (errorId) return next(badRequest(errorId));

    const borrado = await deleteAuthorService(req.params.id);
    if (!borrado) return next(notFound("Autor no encontrado"));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
