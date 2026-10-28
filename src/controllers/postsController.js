import { authors, posts } from "../data/memoria.js";

let nextId = 6;

export const getAllPosts = (req, res) => {
  res.status(200).json(posts);
};

export const getPostById = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "El id debe ser un número" });
  }

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: "Post no encontrado" });
  }

  res.status(200).json(post);
};

export const getPostsByAuthor = (req, res) => {
  const authorId = Number(req.params.authorId);
  const author = authors.find((a) => a.id === authorId);

  if (!author) {
    return res.status(404).json({ error: "Autor no encontrado" });
  }

  // a cada post le agrego los datos de su autor
  const postsDelAutor = posts
    .filter((p) => p.author_id === authorId)
    .map((p) => ({ ...p, author }));

  res.status(200).json(postsDelAutor);
};

export const createPost = (req, res) => {
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

  const author = authors.find((a) => a.id === Number(author_id));
  if (!author) {
    return res.status(404).json({ error: "El autor no existe" });
  }

  const newPost = {
    id: nextId++,
    title: title.trim(),
    content: content.trim(),
    author_id: Number(author_id),
    published: published || false,
  };

  posts.push(newPost);

  res.status(201).json(newPost);
};

export const updatePost = (req, res) => {
  const id = Number(req.params.id);
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Post no encontrado" });
  }

  const { title, content, published } = req.body;

  if (title !== undefined && title.trim() === "") {
    return res.status(400).json({ error: "El título no puede estar vacío" });
  }

  if (content !== undefined && content.trim() === "") {
    return res.status(400).json({ error: "El contenido no puede estar vacío" });
  }

  posts[index] = {
    ...posts[index],
    title: title ?? posts[index].title,
    content: content ?? posts[index].content,
    published: published ?? posts[index].published,
  };

  res.status(200).json(posts[index]);
};

export const deletePost = (req, res) => {
  const id = Number(req.params.id);
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Post no encontrado" });
  }

  posts.splice(index, 1);

  res.status(204).send();
};
