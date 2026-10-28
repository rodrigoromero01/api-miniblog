import { describe, test, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db/config.js";
import { resetearBase } from "./helpers.js";

beforeEach(async () => {
  await resetearBase();
});

afterAll(async () => {
  await pool.end();
});

describe("GET /authors", () => {
  test("devuelve los 3 autores del seed", async () => {
    const response = await request(app).get("/authors");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toHaveProperty("name");
    expect(response.body[0]).toHaveProperty("email");
  });
});

describe("GET /authors/:id", () => {
  test("devuelve el autor si existe", async () => {
    const response = await request(app).get("/authors/1");

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe("Ana García");
    expect(response.body.email).toBe("ana@example.com");
  });

  test("devuelve 404 si el autor no existe", async () => {
    const response = await request(app).get("/authors/999");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Autor no encontrado");
  });

  test("devuelve 400 si el id no es un número", async () => {
    const response = await request(app).get("/authors/abc");

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /authors", () => {
  test("crea un autor con datos válidos", async () => {
    const response = await request(app)
      .post("/authors")
      .send({ name: "Juan Pérez", email: "juan@example.com", bio: "Backend dev" });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Juan Pérez");
    expect(response.body.email).toBe("juan@example.com");

    // me fijo que realmente se haya guardado en la base
    const enLaBase = await request(app).get(`/authors/${response.body.id}`);
    expect(enLaBase.statusCode).toBe(200);
  });

  test("rechaza un autor sin nombre", async () => {
    const response = await request(app).post("/authors").send({ email: "test@example.com" });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("requerido");
  });

  test("rechaza un nombre vacío", async () => {
    const response = await request(app)
      .post("/authors")
      .send({ name: "   ", email: "test@example.com" });

    expect(response.statusCode).toBe(400);
  });

  test("rechaza un email con formato inválido", async () => {
    const response = await request(app)
      .post("/authors")
      .send({ name: "Juan", email: "no-es-un-email" });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("inválido");
  });

  test("rechaza un email que ya existe con 409", async () => {
    const response = await request(app)
      .post("/authors")
      .send({ name: "Otra Ana", email: "ana@example.com" });

    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe("El email ya está registrado");
  });

  test("rechaza un request sin body", async () => {
    const response = await request(app).post("/authors");

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /authors/:id", () => {
  test("actualiza solo los campos que se mandan", async () => {
    const response = await request(app).put("/authors/2").send({ bio: "Bio nueva" });

    expect(response.statusCode).toBe(200);
    expect(response.body.bio).toBe("Bio nueva");
    expect(response.body.name).toBe("Carlos Ruiz"); // el nombre no cambia
  });

  test("devuelve 409 si el email es de otro autor", async () => {
    const response = await request(app).put("/authors/2").send({ email: "ana@example.com" });

    expect(response.statusCode).toBe(409);
  });

  test("devuelve 404 si el autor no existe", async () => {
    const response = await request(app).put("/authors/999").send({ name: "Nadie" });

    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /authors/:id", () => {
  test("elimina el autor y sus posts", async () => {
    const response = await request(app).delete("/authors/1");

    expect(response.statusCode).toBe(204);

    const autor = await request(app).get("/authors/1");
    expect(autor.statusCode).toBe(404);

    // Ana tenía 3 posts, quedan 2 de los 5 (ON DELETE CASCADE)
    const posts = await request(app).get("/posts");
    expect(posts.body).toHaveLength(2);
  });

  test("devuelve 404 al eliminar un autor inexistente", async () => {
    const response = await request(app).delete("/authors/999");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Autor no encontrado");
  });
});
