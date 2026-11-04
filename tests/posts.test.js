import { describe, test, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/db/config.js";

// antes de cada test vacío las tablas y cargo los mismos datos del seed
beforeEach(async () => {
  await pool.query("TRUNCATE authors RESTART IDENTITY CASCADE");
  await pool.query(`
    INSERT INTO authors (name, email, bio) VALUES
      ('Ana García',  'ana@example.com',    'Desarrolladora full-stack apasionada por Node.js'),
      ('Carlos Ruiz', 'carlos@example.com', 'Escritor técnico especializado en bases de datos'),
      ('María López', 'maria@example.com',  'Ingeniera de software con foco en APIs REST')
  `);
  await pool.query(`
    INSERT INTO posts (title, content, author_id, published) VALUES
      ('Introducción a Node.js',       'Node.js es un runtime de JavaScript...',          1, true),
      ('PostgreSQL vs MySQL',          'Ambas bases de datos tienen ventajas...',         2, true),
      ('APIs RESTful',                 'REST es un estilo arquitectónico...',             1, true),
      ('Manejo de errores en Express', 'El manejo apropiado de errores...',               3, false),
      ('Async/Await explicado',        'Las promesas simplifican el código asíncrono...', 1, false)
  `);
});

afterAll(async () => {
  await pool.end();
});

describe("GET /posts", () => {
  test("devuelve los 5 posts del seed", async () => {
    const response = await request(app).get("/posts");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(5);
  });
});

describe("GET /posts/:id", () => {
  test("devuelve el post si existe", async () => {
    const response = await request(app).get("/posts/2");

    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe("PostgreSQL vs MySQL");
    expect(response.body.author_id).toBe(2);
  });

  test("devuelve 404 si el post no existe", async () => {
    const response = await request(app).get("/posts/999");

    expect(response.statusCode).toBe(404);
  });
});

describe("GET /posts/author/:authorId", () => {
  test("devuelve los posts del autor con los datos del autor", async () => {
    const response = await request(app).get("/posts/author/1");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body[0].author_name).toBe("Ana García");
    expect(response.body[0].author_email).toBe("ana@example.com");
  });

  test("devuelve 404 si el autor no existe", async () => {
    const response = await request(app).get("/posts/author/999");

    expect(response.statusCode).toBe(404);
  });
});

describe("POST /posts", () => {
  test("crea un post con datos válidos", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ title: "Mi primer post", content: "Hola mundo", author_id: 2 });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.title).toBe("Mi primer post");
    expect(response.body.published).toBe(false); // por defecto
  });

  test("rechaza un post sin título", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ content: "Hola mundo", author_id: 2 });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("título");
  });

  test("rechaza un post sin contenido", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ title: "Sin contenido", author_id: 2 });

    expect(response.statusCode).toBe(400);
  });

  test("rechaza un post sin author_id", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ title: "Sin autor", content: "Hola" });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain("author_id");
  });

  test("devuelve 404 si el autor no existe", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ title: "Post", content: "Hola", author_id: 999 });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("El autor no existe");
  });

  test("rechaza published si no es booleano", async () => {
    const response = await request(app)
      .post("/posts")
      .send({ title: "Post", content: "Hola", author_id: 1, published: "si" });

    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /posts/:id", () => {
  test("actualiza el post", async () => {
    const response = await request(app).put("/posts/4").send({ published: true });

    expect(response.statusCode).toBe(200);
    expect(response.body.published).toBe(true);
    expect(response.body.title).toBe("Manejo de errores en Express");
  });

  test("devuelve 404 si el post no existe", async () => {
    const response = await request(app).put("/posts/999").send({ title: "Nada" });

    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /posts/:id", () => {
  test("elimina el post", async () => {
    const response = await request(app).delete("/posts/1");

    expect(response.statusCode).toBe(204);

    const buscado = await request(app).get("/posts/1");
    expect(buscado.statusCode).toBe(404);
  });

  test("devuelve 404 al eliminar un post inexistente", async () => {
    const response = await request(app).delete("/posts/999");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("Post no encontrado");
  });
});

describe("Otras rutas", () => {
  test("GET /health responde ok", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  test("una ruta que no existe devuelve 404", async () => {
    const response = await request(app).get("/no-existe");

    expect(response.statusCode).toBe(404);
  });
});
