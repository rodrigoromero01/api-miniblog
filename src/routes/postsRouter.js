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
// las rutas fijas van antes que /:id. Esta tiene dos tramos (/author/1) asi que
// /:id no la agarra igual, pero una ruta como /posts/author si se tomaria como id
postsRouter.get("/author/:authorId", getPostsByAuthor);
postsRouter.get("/:id", getPostById);
postsRouter.post("/", createPost);
postsRouter.put("/:id", updatePost);
postsRouter.delete("/:id", deletePost);

export default postsRouter;
