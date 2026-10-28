import "dotenv/config";
import express from "express";
import router from "./routes/indexRouter.js";
import { errorHandler, rutaNoEncontrada } from "./middlewares/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const app = express();

// Middleware
app.use(express.json());

// Documentación: http://localhost:3000/api-docs
const swaggerDocument = YAML.load("src/docs/openapi.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
