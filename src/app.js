import "dotenv/config";
import express from "express";
import router from "./routes/indexRouter.js";

const app = express();

// Middleware
app.use(express.json());

app.use(router);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

export default app;
