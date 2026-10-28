import { Router } from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getPostsByAuthor,
  updatePost,
} from "../controllers/postsController.js";

const postsRouter = Router();

postsRouter.get("/", getAllPosts);
// esta ruta va antes que /:id para que "author" no se tome como un id
postsRouter.get("/author/:authorId", getPostsByAuthor);
postsRouter.get("/:id", getPostById);
postsRouter.post("/", createPost);
postsRouter.put("/:id", updatePost);
postsRouter.delete("/:id", deletePost);

export default postsRouter;
