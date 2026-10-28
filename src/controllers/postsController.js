import { getAuthorByIdService } from "../services/authorsService.js";
import {
  createPostService,
  deletePostService,
  getAllPostsService,
  getPostByIdService,
  getPostsByAuthorService,
  updatePostService,
} from "../services/postsService.js";
import { badRequest, notFound } from "../utils/errors.js";
import { validarId, validarPublished, validarTexto } from "../utils/validators.js";

export const getAllPosts = async (req, res, next) => {
  try {
    const posts = await getAllPostsService();
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const errorId = validarId(req.params.id);
    if (errorId) return next(badRequest(errorId));

    const post = await getPostByIdService(req.params.id);
    if (!post) return next(notFound("Post no encontrado"));

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const getPostsByAuthor = async (req, res, next) => {
  try {
    const errorId = validarId(req.params.authorId, "id del autor");
    if (errorId) return next(badRequest(errorId));

    // primero me fijo que el autor exista para poder devolver 404
    const author = await getAuthorByIdService(req.params.authorId);
    if (!author) return next(notFound("Autor no encontrado"));

    const posts = await getPostsByAuthorService(req.params.authorId);

    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, content, author_id, published } = req.body || {};

    const errorTitulo = validarTexto(title, "título", 200);
    if (errorTitulo) return next(badRequest(errorTitulo));

    const errorContenido = validarTexto(content, "contenido");
    if (errorContenido) return next(badRequest(errorContenido));

    if (author_id === undefined || author_id === null || author_id === "") {
      return next(badRequest("El author_id es requerido"));
    }

    const errorAutor = validarId(author_id, "author_id");
    if (errorAutor) return next(badRequest(errorAutor));

    const errorPublished = validarPublished(published);
    if (errorPublished) return next(badRequest(errorPublished));

    // si el autor no existe la base tira error 23503 y el errorHandler responde 404
    const newPost = await createPostService(title.trim(), content.trim(), author_id, published);

    res.status(201).json(newPost);
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const errorId = validarId(req.params.id);
    if (errorId) return next(badRequest(errorId));

    const { title, content, published } = req.body || {};

    if (title !== undefined) {
      const errorTitulo = validarTexto(title, "título", 200);
      if (errorTitulo) return next(badRequest(errorTitulo));
    }

    if (content !== undefined) {
      const errorContenido = validarTexto(content, "contenido");
      if (errorContenido) return next(badRequest(errorContenido));
    }

    const errorPublished = validarPublished(published);
    if (errorPublished) return next(badRequest(errorPublished));

    const post = await updatePostService(req.params.id, title?.trim(), content?.trim(), published);
    if (!post) return next(notFound("Post no encontrado"));

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const errorId = validarId(req.params.id);
    if (errorId) return next(badRequest(errorId));

    const borrado = await deletePostService(req.params.id);
    if (!borrado) return next(notFound("Post no encontrado"));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
