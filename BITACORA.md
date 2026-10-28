# Bitácora del proyecto - API MiniBlog

Acá voy anotando lo que hago en cada paso del proyecto, los problemas que aparecen y cómo los resolví.

---

## Paso 1 - Setup inicial

**Qué hice:**

- Creé la carpeta `api-miniblog` e inicialicé git (`git init`) y npm (`npm init -y`).
- Instalé las dependencias:
  - `express` → servidor y rutas
  - `pg` → conexión a PostgreSQL
  - `dotenv` → leer variables de entorno del archivo `.env`
  - `swagger-ui-express` y `yamljs` → para mostrar la documentación OpenAPI
  - De desarrollo: `vitest` y `supertest` para los tests
- En `package.json` cambié `"type"` a `"module"` para usar `import/export` como vimos en clase, y agregué los scripts `start`, `dev` y `test`.
- Creé `.gitignore` (ignora `node_modules` y `.env`) y `.env.example` con las variables que hacen falta, sin datos reales.
- Separé `app.js` (configura express) de `index.js` (levanta el servidor). Esto es para que después en los tests pueda importar la app sin que se levante el servidor.
- Agregué un endpoint `GET /health` para probar que el servidor anda.

**Cómo probarlo:**

```bash
npm run dev
```

Y en el navegador o Postman: `http://localhost:3000/health` → `{ "status": "ok" }`

**Estructura de carpetas que voy a usar:**

```
src/
  controllers/   -> reciben el request y devuelven la respuesta
  services/      -> las consultas SQL
  routes/        -> definen los endpoints
  db/            -> conexión y scripts .sql
  middlewares/   -> manejo de errores
  utils/         -> validaciones y helpers
  docs/          -> openapi.yaml
tests/
```

---

## Paso 2 - Base de datos

**Qué hice:**

- Creé la base de datos local:
  ```bash
  psql -U postgres -c "CREATE DATABASE miniblog;"
  ```
- Copié `.env.example` a `.env` y puse mi contraseña de Postgres (el `.env` no se sube a GitHub).
- `src/db/setup.sql`: crea las tablas `authors` y `posts`.
  - `email` es `UNIQUE` para que no se repita.
  - `posts.author_id` es FOREIGN KEY a `authors.id` con `ON DELETE CASCADE` (si borro un autor se borran sus posts).
  - Agregué un índice en `posts.author_id` porque vamos a buscar posts por autor.
  - Al principio tiene `DROP TABLE IF EXISTS` para poder correrlo varias veces.
- `src/db/seed.sql`: carga 3 autores y 5 posts de ejemplo (los de la guía).
- `src/db/pruebas.sql`: consultas CRUD que corrí a mano para verificar que todo funciona antes de conectar Express.
- `src/db/config.js`: crea el `Pool` de `pg` usando `DATABASE_URL`.
- `src/db/test-connection.js`: script para probar la conexión (`npm run db:test`).

**Cómo correrlo:**

```bash
psql -U postgres -d miniblog -f src/db/setup.sql
psql -U postgres -d miniblog -f src/db/seed.sql
psql -U postgres -d miniblog -f src/db/pruebas.sql
npm run db:test
```

**Resultados de las pruebas:**

- `SELECT` de authors y posts → 3 autores y 5 posts ✅
- JOIN de posts con su autor (author_id = 1) → 3 posts de Ana García ✅
- `INSERT`, `UPDATE` y `DELETE` de un autor de prueba ✅
- Insertar un email repetido → error `authors_email_key` (el UNIQUE funciona) ✅
- Insertar un post con `author_id = 999` → error `posts_author_id_fkey` (la FK funciona) ✅
- `npm run db:test` → `✅ Conectado! ... Autores: 3 | Posts: 5` ✅

**Problemas que tuve:**

- No me acordaba la contraseña del usuario `postgres`. La reseteé cambiando temporalmente `pg_hba.conf` a `trust`, reiniciando el servicio y corriendo `ALTER USER postgres PASSWORD '...'`. Después restauré el archivo original.
- Primero cambié las líneas de `replication` en vez de las de `host all all` y por eso seguía pidiendo clave.
