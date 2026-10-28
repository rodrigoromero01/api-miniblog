import { authors, posts } from "../data/memoria.js";

let nextId = 4;

export const getAllAuthors = (req, res) => {
  res.status(200).json(authors);
};

export const getAuthorById = (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "El id debe ser un número" });
  }

  const author = authors.find((a) => a.id === id);

  if (!author) {
    return res.status(404).json({ error: "Autor no encontrado" });
  }

  res.status(200).json(author);
};

export const createAuthor = (req, res) => {
  const { name, email, bio } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "El nombre es requerido" });
  }

  if (!email || email.trim() === "") {
    return res.status(400).json({ error: "El email es requerido" });
  }

  const emailExiste = authors.some((a) => a.email === email);
  if (emailExiste) {
    return res.status(409).json({ error: "El email ya está registrado" });
  }

  const newAuthor = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    bio: bio || null,
  };

  authors.push(newAuthor);

  res.status(201).json(newAuthor);
};

export const updateAuthor = (req, res) => {
  const id = Number(req.params.id);
  const index = authors.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Autor no encontrado" });
  }

  const { name, email, bio } = req.body;

  if (name !== undefined && name.trim() === "") {
    return res.status(400).json({ error: "El nombre no puede estar vacío" });
  }

  // el email no puede ser de otro autor
  const emailExiste = authors.some((a) => a.email === email && a.id !== id);
  if (emailExiste) {
    return res.status(409).json({ error: "El email ya está registrado" });
  }

  authors[index] = {
    ...authors[index],
    name: name ?? authors[index].name,
    email: email ?? authors[index].email,
    bio: bio ?? authors[index].bio,
  };

  res.status(200).json(authors[index]);
};

export const deleteAuthor = (req, res) => {
  const id = Number(req.params.id);
  const index = authors.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Autor no encontrado" });
  }

  authors.splice(index, 1);

  // igual que el ON DELETE CASCADE de la base: borro los posts del autor
  for (let i = posts.length - 1; i >= 0; i--) {
    if (posts[i].author_id === id) {
      posts.splice(i, 1);
    }
  }

  res.status(204).send();
};
