# API MiniBlog

Mi Proyecto Integrador del Módulo 2 de Henry: una API REST para manejar **autores** y **posts** de un blog, hecha con **Node.js**, **Express** y **PostgreSQL**.

La consigna plantea que soy backend junior en *DevSpark*, una startup que arma **MiniBlog**. El frontend ya tenía las pantallas pero faltaba el backend: una API con CRUD de autores y posts, validaciones, tests y documentación.

- **API online:** https://api-miniblog.onrender.com
- **Swagger:** https://api-miniblog.onrender.com/api-docs

> Está en el plan gratis de Render: si nadie la usa por 15 minutos se duerme y el primer request tarda casi un minuto.

**Tecnologías:** Node.js, Express 5, PostgreSQL con `pg` (SQL directo, sin ORM), dotenv, vitest + supertest, OpenAPI con swagger-ui-express, Render.

## Estructura

Seguí la estructura que vimos en clase:

```
src/
  routes/        -> endpoints
  controllers/   -> validan lo que llega y arman la respuesta
  services/      -> consultas SQL
  middlewares/   -> errorHandler
  utils/         -> errores y validaciones
  db/            -> conexión (config.js), setup.sql y seed.sql
  docs/          -> openapi.yaml
tests/
BITACORA.md      -> lo que hice en cada paso
```

Un request pasa por **route → controller → service → base de datos**. Si algo falla, el controller hace `next(error)` y el `errorHandler` responde con el código correcto.

## Base de datos

- **authors:** `id` (PK), `name` (obligatorio), `email` (obligatorio y único), `bio`, `created_at`.
- **posts:** `id` (PK), `title` y `content` (obligatorios), `author_id` (FK a `authors.id`), `published` (por defecto `false`), `created_at`.

Un autor tiene muchos posts. La FK tiene `ON DELETE CASCADE`, así que si borro un autor se borran sus posts.

## Endpoints

| Método | Ruta | Qué hace | Respuestas |
|---|---|---|---|
| GET | `/authors` | lista los autores | 200 |
| GET | `/authors/:id` | trae un autor | 200, 400, 404 |
| POST | `/authors` | crea un autor | 201, 400, 409 |
| PUT | `/authors/:id` | actualiza un autor | 200, 400, 404, 409 |
| DELETE | `/authors/:id` | borra un autor y sus posts | 204, 400, 404 |
| GET | `/posts` | lista los posts | 200 |
| GET | `/posts/:id` | trae un post | 200, 400, 404 |
| GET | `/posts/author/:authorId` | posts de un autor con sus datos | 200, 400, 404 |
| POST | `/posts` | crea un post | 201, 400, 404 |
| PUT | `/posts/:id` | actualiza un post | 200, 400, 404 |
| DELETE | `/posts/:id` | borra un post | 204, 400, 404 |
| GET | `/health` | ver si el servidor anda | 200 |

**Validaciones:** `name` obligatorio; `email` obligatorio, con formato válido y sin repetir (si se repite, **409**); `title`, `content` y `author_id` obligatorios para crear un post, y el autor tiene que existir (si no, **404**); los ids tienen que ser números (si no, **400**). En los `PUT` solo se cambia lo que mandás.

Los errores vuelven siempre igual: `{ "error": "Autor no encontrado", "status": 404 }`

## Cómo correrlo en local

Necesitás Node.js 20+, PostgreSQL y Git.

```bash
git clone https://github.com/rodrigoromero01/api-miniblog.git
cd api-miniblog
npm install
```

Creá dos bases, una para trabajar y otra para los tests (los tests borran los datos antes de correr):

```bash
psql -U postgres -c "CREATE DATABASE miniblog;"
psql -U postgres -c "CREATE DATABASE miniblog_test;"
```

Copiá `.env.example` como `.env` y completá tu contraseña de Postgres:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/miniblog
TEST_DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/miniblog_test
```

Creá las tablas y cargá los datos de ejemplo (3 autores y 5 posts):

```bash
psql -U postgres -d miniblog -f src/db/setup.sql
psql -U postgres -d miniblog -f src/db/seed.sql
psql -U postgres -d miniblog_test -f src/db/setup.sql
```

Levantá el servidor:

```bash
npm run dev
```

Queda en `http://localhost:3000`. Para probar la conexión a la base también está `npm run db:test`.

## Tests

```bash
npm test
```

Son 44 tests (endpoints de autores y posts con supertest, y las funciones de validación) y pasan todos. Antes de cada test se vacían las tablas de `miniblog_test` y se cargan los datos del seed, así nunca tocan la base con la que trabajo.

## Documentación

El archivo está en [`src/docs/openapi.yaml`](src/docs/openapi.yaml). Con el servidor corriendo, entrá a `http://localhost:3000/api-docs` (o a la versión online). Ahí se pueden probar todos los endpoints con **"Try it out"**.

## Deploy en Render

La consigna pedía Railway, pero mi período de prueba había vencido y me autorizaron a usar Render.

1. Agregué [`render.yaml`](render.yaml), que crea el servicio de la API (`npm install`, `npm start`, health check en `/health`) y una base PostgreSQL.
2. En Render: **New → Blueprint**, elegí el repo y deployé.
3. La base arranca vacía, así que corrí los scripts desde mi PC con la External Database URL:

   ```bash
   psql "<External Database URL>?sslmode=require" -f src/db/setup.sql
   psql "<External Database URL>?sslmode=require" -f src/db/seed.sql
   ```

Cada `git push` a `main` vuelve a deployar solo.

**Variables de entorno:** `DATABASE_URL` la completa Render con la URL interna de la base (lo indica el `render.yaml`) y `PORT` también la pone Render.

**URLs:**

- **URL pública:** https://api-miniblog.onrender.com (la que usa cualquiera para llamar a la API)
- **Internal Database URL:** solo funciona dentro de Render; es la que usa la API para conectarse a la base.
- **External Database URL:** para conectarse a la base desde afuera (psql o pgAdmin). La usé solo para crear las tablas.

Ninguna URL de la base está en el repo porque tienen la contraseña. La base gratis vence a los 30 días; si pasa, hay que crear otra y volver a correr los scripts.

## Registro del uso de IA

<!-- COMPLETAR CON MIS PALABRAS ANTES DE ENTREGAR -->

Usé **Claude Code**, un asistente de IA que trabaja en la terminal y puede leer y escribir los archivos del proyecto. Fui avanzando paso a paso en el orden de la guía: le pedía cada paso, Claude Code escribía el código y lo probaba, y yo revisaba antes de seguir. Cada paso quedó en un commit y en [`BITACORA.md`](BITACORA.md).

**Prompts principales:**

- Le pasé la consigna y le pedí que me propusiera cómo arrancar.
- Le pasé el repo de los ejemplos de clase para que siguiera esa estructura.
- "Seguí con el paso N" para cada parte.
- _[completar: otros prompts que me acuerde]_

**Qué decidí yo:** _[completar: por ejemplo la base aparte para los tests, pasar a Render, qué simplificar]_

**Qué aprendí:** _[completar con mis palabras: por ejemplo `$1`/`$2` contra SQL injection, `ON DELETE CASCADE`, 409 vs 400, el `errorHandler`, URL interna vs externa]_
