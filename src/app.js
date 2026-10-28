import "dotenv/config";
import express from "express";
import router from "./routes/indexRouter.js";
import { errorHandler, rutaNoEncontrada } from "./middlewares/errorHandler.js";

const app = express();

// Middleware
app.use(express.json());

app.use(router);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

// estos dos van al final, despues de todas las rutas
app.use(rutaNoEncontrada);
app.use(errorHandler);

export default app;
