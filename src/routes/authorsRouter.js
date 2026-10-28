import { Router } from "express";
import {
  createAuthor,
  deleteAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
} from "../controllers/authorsController.js";

const authorsRouter = Router();

authorsRouter.get("/", getAllAuthors);
authorsRouter.get("/:id", getAuthorById);
authorsRouter.post("/", createAuthor);
authorsRouter.put("/:id", updateAuthor);
authorsRouter.delete("/:id", deleteAuthor);

export default authorsRouter;
