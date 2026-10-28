import { getAuthorByIdService } from "../services/authorsService.js";
import {
  createPostService,
  deletePostService,
  getAllPostsService,
  getPostByIdService,
  getPostsByAuthorService,
  updatePostService,
} from "../services/postsService.js";

export const getAllPosts = async (req, res) => {
  try {
    const posts = await getAllPostsService();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error obteniendo posts:", error);
    res.status(500).json({ error: "Error obteniendo posts" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "El id debe ser un número" });
    }

    const post = await getPostByIdService(id);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error obteniendo post:", error);
    res.status(500).json({ error: "Error obteniendo post" });
  }
};

export const getPostsByAuthor = async (req, res) => {
  try {
    const authorId = Number(req.params.authorId);

    if (isNaN(authorId)) {
      return res.status(400).json({ error: "El id del autor debe ser un número" });
    }

    // primero me fijo que el autor exista para poder devolver 404
    const author = await getAuthorByIdService(authorId);

    if (!author) {
      return res.status(404).json({ error: "Autor no encontrado" });
    }

    const posts = await getPostsByAuthorService(authorId);

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error obteniendo posts del autor:", error);
    res.status(500).json({ error: "Error obteniendo posts del autor" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, content, author_id, published } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "El título es requerido" });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "El contenido es requerido" });
    }

    if (!author_id) {
      return res.status(400).json({ error: "El author_id es requerido" });
    }

    const newPost = await createPostService(title.trim(), content.trim(), author_id, published);

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creando post:", error);

    // 23503 = violación de FOREIGN KEY (el autor no existe)
    if (error.code === "23503") {
      return res.status(404).json({ error: "El autor no existe" });
    }

    res.status(500).json({ error: "Error creando post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "El id debe ser un número" });
    }

    const { title, content, published } = req.body;

    if (title !== undefined && title.trim() === "") {
      return res.status(400).json({ error: "El título no puede estar vacío" });
    }

    if (content !== undefined && content.trim() === "") {
      return res.status(400).json({ error: "El contenido no puede estar vacío" });
    }

    const post = await updatePostService(id, title, content, published);

    if (!post) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error actualizando post:", error);
    res.status(500).json({ error: "Error actualizando post" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "El id debe ser un número" });
    }

    const borrado = await deletePostService(id);

    if (!borrado) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error eliminando post:", error);
    res.status(500).json({ error: "Error eliminando post" });
  }
};
