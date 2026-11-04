import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // los tests borran las tablas, por eso usan la base miniblog_test y no la de desarrollo
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL,
    },
    // los dos archivos de test usan la misma base, asi que los corro de a uno
    fileParallelism: false,
  },
});
