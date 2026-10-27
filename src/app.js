import "dotenv/config";
import express from "express";

const app = express();

// Middleware
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

export default app;
