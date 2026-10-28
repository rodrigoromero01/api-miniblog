import {
  createAuthorService,
  deleteAuthorService,
  getAllAuthorsService,
  getAuthorByIdService,
  updateAuthorService,
} from "../services/authorsService.js";

export const getAllAuthors = async (req, res) => {
  try {
    const authors = await getAllAuthorsService();
    res.status(200).json(authors);
  } catch (error) {
    console.error("Error obteniendo autores:", error);
    res.status(500).json({ error: "Error obteniendo autores" });
  }
};

export const getAuthorById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "El id debe ser un número" });
    }

    const author = await getAuthorByIdService(id);

    if (!author) {
      return res.status(404).json({ error: "Autor no encontrado" });
    }

    res.status(200).json(author);
  } catch (error) {
    console.error("Error obteniendo autor:", error);
    res.status(500).json({ error: "Error obteniendo autor" });
  }
};

export const createAuthor = async (req, res) => {
  try {
    const { name, email, bio } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "El email es requerido" });
    }

    const newAuthor = await createAuthorService(name.trim(), email.trim(), bio);

    res.status(201).json(newAuthor);
  } catch (error) {
    console.error("Error creando autor:", error);

    // 23505 = violación de UNIQUE (email repetido)
    if (error.code === "23505") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    res.status(500).json({ error: "Error creando autor" });
  }
};

export const updateAuthor = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "El id debe ser un número" });
    }

    const { name, email, bio } = req.body;

    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ error: "El nombre no puede estar vacío" });
    }

    const author = await updateAuthorService(id, name, email, bio);

    if (!author) {
      return res.status(404).json({ error: "Autor no encontrado" });
    }

    res.status(200).json(author);
  } catch (error) {
    console.error("Error actualizando autor:", error);

    if (error.code === "23505") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    res.status(500).json({ error: "Error actualizando autor" });
  }
};

export const deleteAuthor = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "El id debe ser un número" });
    }

    const borrado = await deleteAuthorService(id);

    if (!borrado) {
      return res.status(404).json({ error: "Autor no encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error eliminando autor:", error);
    res.status(500).json({ error: "Error eliminando autor" });
  }
};
