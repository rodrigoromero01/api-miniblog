# API MiniBlog

Este es mi Proyecto Integrador del Módulo 2 de Henry: una API REST para manejar **autores** y **posts** de un blog, hecha con **Node.js**, **Express** y **PostgreSQL**.

La idea de la consigna es que trabajo como backend junior en *DevSpark*, una startup que está armando **MiniBlog**. El equipo de frontend ya tenía las pantallas pero no había backend, así que la API tenía que permitir crear, leer, actualizar y borrar autores y posts, con validaciones, tests y documentación para que la puedan usar.

- **Repo:** https://github.com/rodrigoromero01/api-miniblog
- **API online (Render):** https://api-miniblog.onrender.com
- **Documentación (Swagger):** https://api-miniblog.onrender.com/api-docs

> Ojo: está en el plan gratis de Render, así que si nadie la usa por 15 minutos se "duerme" y el primer request tarda casi un minuto en responder. Después anda normal.

---

## Con qué lo hice

- **Node.js + Express 5** para el servidor
- **PostgreSQL** con la librería **`pg`** (consultas SQL directas, sin ORM)
- **dotenv** para las variables de entorno
- **vitest + supertest** para los tests
- **OpenAPI + swagger-ui-express + yamljs** para la documentación
- **Render** para el deploy

---

## Cómo está organizado

Seguí la misma estructura que vimos en clase:

```
src/
  app.js              -> configura express, las rutas, swagger y el manejo de errores
  index.js            -> levanta el servidor
  routes/             -> los endpoints
  controllers/        -> validan lo que llega y arman la respuesta
  services/           -> las consultas SQL
  middlewares/        -> errorHandler (todos los errores terminan acá)
  utils/              -> errores (badRequest, notFound...) y validaciones
  db/
    config.js         -> conexión a PostgreSQL con Pool
    test-connection.js
    setup.sql         -> crea las tablas
    seed.sql          -> datos de ejemplo
    pruebas.sql       -> consultas que usé para probar a mano
  docs/openapi.yaml   -> documentación
tests/                -> tests
BITACORA.md           -> lo que fui haciendo en cada paso
```

Un request pasa así: **route → controller → service → base de datos**. Si algo sale mal, el controller hace `next(error)` y el `errorHandler` responde con el código que corresponde.

---

## Base de datos

Tengo dos tablas: `authors` y `posts`. Un autor puede tener muchos posts (relación uno a muchos).

**authors:** `id` (PK), `name` (obligatorio), `email` (obligatorio y único), `bio` (opcional), `created_at`.

**posts:** `id` (PK), `title` (obligatorio), `content` (obligatorio), `author_id` (obligatorio, FK a `authors.id`), `published` (por defecto `false`), `created_at`.

La FK tiene `ON DELETE CASCADE`: si borro un autor, se borran solos todos sus posts. También le puse un índice a `posts.author_id` porque se buscan posts por autor.

---

## Endpoints

| Método | Ruta | Qué hace | Respuestas |
|---|---|---|---|
| GET | `/authors` | lista los autores | 200 |
| GET | `/authors/:id` | trae un autor | 200, 400, 404 |
| POST | `/authors` | crea un autor | 201, 400, 409 |
| PUT | `/authors/:id` | actualiza un autor | 200, 400, 404, 409 |
| DELETE | `/authors/:id` | borra un autor (y sus posts) | 204, 400, 404 |
| GET | `/posts` | lista los posts | 200 |
| GET | `/posts/:id` | trae un post | 200, 400, 404 |
| GET | `/posts/author/:authorId` | posts de un autor, con los datos del autor | 200, 400, 404 |
| POST | `/posts` | crea un post | 201, 400, 404 |
| PUT | `/posts/:id` | actualiza un post | 200, 400, 404 |
| DELETE | `/posts/:id` | borra un post | 204, 400, 404 |
| GET | `/health` | para ver si el servidor anda | 200 |

**Validaciones que hice:**

- `name` es obligatorio y no puede estar vacío.
- `email` es obligatorio, tiene que tener formato de email y no se puede repetir (si se repite devuelve **409**).
- Para crear un post hacen falta `title`, `content` y `author_id`, y el autor tiene que existir (si no, **404**).
- `published` es opcional, pero si viene tiene que ser `true` o `false`.
- Los ids tienen que ser números (si mandás `/authors/abc` devuelve **400**).
- En los `PUT` se cambia solo lo que mandás, lo demás queda igual.

Todos los errores vuelven con el mismo formato:

```json
{ "error": "Autor no encontrado", "status": 404 }
```

Ejemplo para crear un post:

```http
POST /posts
Content-Type: application/json

{
  "title": "Mi primer post",
  "content": "Hola mundo",
  "author_id": 1
}
```

Devuelve `201` con el post creado (con su `id`, `published: false` y `created_at`).

---

## Cómo correrlo en local

**Necesitás:** Node.js 20 o más nuevo, PostgreSQL (yo usé la 18) y Git.

**1. Clonar e instalar**

```bash
git clone https://github.com/rodrigoromero01/api-miniblog.git
cd api-miniblog
npm install
```

**2. Crear las bases de datos.** Uso dos: una para trabajar y otra solo para los tests (porque los tests borran todo antes de correr).

```bash
psql -U postgres -c "CREATE DATABASE miniblog;"
psql -U postgres -c "CREATE DATABASE miniblog_test;"
```

**3. Armar el `.env`.** Copiá `.env.example` como `.env` y poné tu usuario y contraseña de Postgres:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/miniblog
TEST_DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/miniblog_test
```

El `.env` está en el `.gitignore`, no se sube a GitHub.

**4. Crear las tablas y cargar los datos de ejemplo**

```bash
psql -U postgres -d miniblog -f src/db/setup.sql
psql -U postgres -d miniblog -f src/db/seed.sql

# a la base de tests solo le hacen falta las tablas
psql -U postgres -d miniblog_test -f src/db/setup.sql
```

Eso carga 3 autores y 5 posts. Para ver si la app se conecta bien:

```bash
npm run db:test
# ✅ Conectado! ... Autores: 3 | Posts: 5
```

Si querés dejar la base como al principio, volvé a correr `setup.sql` y `seed.sql` (el setup borra las tablas y las crea de nuevo).

**5. Levantar el servidor**

```bash
npm run dev    # se reinicia solo cuando guardás cambios
```

Queda en `http://localhost:3000`. Probá `http://localhost:3000/health` y tiene que devolver `{ "status": "ok" }`.

**Scripts:**

- `npm start` → levanta el servidor
- `npm run dev` → lo levanta y lo reinicia al guardar
- `npm test` → corre los tests
- `npm run test:watch` → deja los tests corriendo mientras programás
- `npm run db:test` → prueba la conexión a la base

---

## Tests

```bash
npm test
```

```
 Test Files  3 passed (3)
      Tests  44 passed (44)
```

- `tests/authors.test.js` → endpoints de autores
- `tests/posts.test.js` → endpoints de posts, `/health` y una ruta que no existe
- `tests/validators.test.js` → las funciones de validación solas

Los tests de endpoints usan supertest contra la app y la base `miniblog_test`. Antes de cada test vacío las tablas con `TRUNCATE ... RESTART IDENTITY CASCADE` y cargo los mismos datos del seed, así todos arrancan igual. En `vitest.config.js` cambio `DATABASE_URL` por `TEST_DATABASE_URL`, así nunca tocan la base con la que trabajo.

---

## Documentación (OpenAPI / Swagger)

La documentación está en [`src/docs/openapi.yaml`](src/docs/openapi.yaml). Con el servidor corriendo, entrá a:

- Local: http://localhost:3000/api-docs
- Online: https://api-miniblog.onrender.com/api-docs

Ahí están todos los endpoints con ejemplos, y se pueden probar con el botón **"Try it out"**. Arriba se puede elegir si probar contra local o contra Render.

---

## Deploy

La consigna pedía Railway, pero cuando fui a crear el proyecto mi período de prueba ya estaba vencido (me salía `Your trial has expired. Please select a plan to continue using Railway.`). Consulté y me dejaron usar **Render**, que funciona parecido: agarra el código de GitHub, lo instala, lo arranca y te da una base PostgreSQL.

**URLs:**

- URL pública de la API: https://api-miniblog.onrender.com
- Health check: https://api-miniblog.onrender.com/health
- Swagger: https://api-miniblog.onrender.com/api-docs

**Cómo lo hice:**

1. Agregué al repo el archivo [`render.yaml`](render.yaml), que le dice a Render que cree dos cosas: el servicio de la API (`npm install` para instalar, `npm start` para arrancar y `/health` para chequear que levantó) y una base PostgreSQL (`miniblog-db`).
2. En el dashboard de Render: **New → Blueprint**, elegí el repo y le di a deploy.
3. La API levantó, pero `/authors` daba error 500 porque la base de Render estaba vacía.
4. Copié la **External Database URL** de la base y corrí los scripts desde mi PC:

   ```bash
   psql "<External Database URL>?sslmode=require" -f src/db/setup.sql
   psql "<External Database URL>?sslmode=require" -f src/db/seed.sql
   ```

5. Probé todos los endpoints contra la URL pública y anduvieron igual que en local.

Cada vez que hago `git push` a `main`, Render vuelve a deployar solo.

**Variables de entorno en Render:**

- `DATABASE_URL` → la completa Render sola con la URL interna de la base (lo configura el `render.yaml`).
- `PORT` → también la pone Render. Mi código ya usa `process.env.PORT`.

**URL interna vs URL externa de la base:**

- La **Internal Database URL** solo funciona adentro de Render. Es la que usa la API, porque es más rápida y no sale a internet.
- La **External Database URL** sirve para conectarse desde afuera, por ejemplo desde mi PC con `psql` o pgAdmin. La usé solo para crear las tablas. Pide SSL (`?sslmode=require`).

Ninguna de las dos está en el repo porque tienen la contraseña.

**Cosas a tener en cuenta del plan gratis:** la API se duerme a los 15 minutos sin uso, y la base gratis vence a los 30 días de creada. Si vence, hay que crear otra y volver a correr `setup.sql` y `seed.sql`.

---

## Registro del uso de IA

<!-- COMPLETAR CON MIS PALABRAS ANTES DE ENTREGAR -->

**Herramienta:** usé **Claude Code**, un asistente de IA que trabaja en la terminal y puede leer y escribir los archivos del proyecto.

**Cómo la usé:** fui avanzando paso a paso en el orden que recomienda la guía. Le pedía cada paso, Claude Code escribía el código y lo probaba, y yo revisaba lo que había hecho antes de pasar al siguiente. Cada paso quedó en un commit y anotado en [`BITACORA.md`](BITACORA.md).

**Prompts principales que usé:**

- Le pasé la consigna y le pedí que la leyera y me propusiera cómo arrancar.
- Le pasé el repo con los ejemplos de clase para que siguiera esa misma estructura.
- "Seguí con el paso N" para cada parte del proyecto.
- _[completar: otros prompts que me acuerde, por ejemplo cuando no me acordaba la contraseña de Postgres o cuando cambiamos a Render]_

**Qué decidí yo:**

- _[completar: por ejemplo usar una base aparte para los tests, pasar a Render cuando Railway no me dejó, qué partes simplificar]_

**Qué aprendí:**

- _[completar con mis palabras. Ideas: por qué las consultas van con `$1`, `$2`; qué hace `ON DELETE CASCADE`; por qué un email repetido es 409 y no 400; para qué sirve el `errorHandler`; la diferencia entre URL interna y externa]_
