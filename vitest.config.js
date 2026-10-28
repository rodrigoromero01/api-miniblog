import "dotenv/config";
import { defineConfig } from "vitest/config";

// Los tests borran y vuelven a crear las tablas, por eso usan una base aparte.
// Si no está TEST_DATABASE_URL no corro nada para no borrar la base de desarrollo.
if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Falta TEST_DATABASE_URL en el .env (ver .env.example)");
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // la app usa DATABASE_URL, en los tests la piso con la base de test
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
    // los archivos de test usan la misma base, asi que los corro de a uno
    fileParallelism: false,
  },
});
