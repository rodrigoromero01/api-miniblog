# API MiniBlog

API REST para gestionar **autores** y **posts** de un blog, hecha con **Node.js**, **Express** y **PostgreSQL**.

Proyecto Integrador del Módulo 2 de Henry. La consigna plantea que soy desarrollador backend junior en *DevSpark*, una startup que necesita una API simple y documentada para su servicio de contenidos **MiniBlog**, que después va a usar el equipo de frontend.

- **Repositorio:** https://github.com/rodrigoromero01/api-miniblog
- **API en producción (Railway):** _pendiente_
- **Documentación (Swagger):** _pendiente_ (en local: http://localhost:3000/api-docs)

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Base de datos](#base-de-datos)
4. [Endpoints](#endpoints)
5. [Cómo ejecutarlo en local](#cómo-ejecutarlo-en-local)
6. [Tests](#tests)
7. [Documentación OpenAPI](#documentación-openapi)
8. [Deploy en Railway](#deploy-en-railway)
9. [Registro del uso de IA](#registro-del-uso-de-ia)

---

## Tecnologías

| Para qué | Qué usé |
|---|---|
| Servidor | Node.js + Express 5 |
| Base de datos | PostgreSQL + `pg` (consultas SQL directas, sin ORM) |
| Variables de entorno | `dotenv` |
| Tests | `vitest` + `supertest` |
| Documentación | OpenAPI 3.1 + `swagger-ui-express` + `yamljs` |
| Deploy | Railway |

---

## Estructura del proyecto

```
api-miniblog/
├── src/
│   ├── app.js                 # configura express, rutas, swagger y errores
│   ├── index.js               # levanta el servidor
│   ├── routes/                # definen los endpoints
│   ├── controllers/           # validan el request y arman la respuesta
│   ├── services/              # consultas SQL (parametrizadas)
│   ├── middlewares/
│   │   └── errorHandler.js    # manejo global de errores + 404 de rutas
│   ├── utils/
│   │   ├── errors.js          # badRequest, notFound, conflict
│   │   └── validators.js      # validarNombre, validarEmail, validarId, ...
│   ├── db/
│   │   ├── config.js          # Pool de conexión a PostgreSQL
│   │   ├── test-connection.js # script para probar la conexión
│   │   ├── setup.sql          # crea las tablas
│   │   ├── seed.sql           # datos de ejemplo
│   │   └── pruebas.sql        # consultas CRUD para probar a mano
│   └── docs/
│       └── openapi.yaml       # documentación de la API
├── tests/                     # tests con vitest + supertest
├── .env.example
├── BITACORA.md                # lo que fui haciendo paso a paso
└── README.md
```

El flujo de un request es: **routes → controllers → services → base de datos**. Si algo falla, el controller llama a `next(error)` y el `errorHandler` responde con el código HTTP que corresponde.

---

## Base de datos

Dos tablas con una relación **uno a muchos**: un autor puede tener muchos posts.

**authors**

| Columna | Tipo | Detalle |
|---|---|---|
| id | SERIAL | PK |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | NOT NULL, UNIQUE |
| bio | TEXT | opcional |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**posts**

| Columna | Tipo | Detalle |
|---|---|---|
| id | SERIAL | PK |
| title | VARCHAR(200) | NOT NULL |
| content | TEXT | NOT NULL |
| author_id | INTEGER | NOT NULL, FK → authors.id, **ON DELETE CASCADE** |
| published | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

Además hay un índice en `posts.author_id` para que sea rápido buscar los posts de un autor. Si se borra un autor, sus posts se borran automáticamente (`ON DELETE CASCADE`).

---

## Endpoints

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| GET | `/authors` | Listar autores | 200 |
| GET | `/authors/:id` | Detalle de un autor | 200, 400, 404 |
| POST | `/authors` | Crear autor | 201, 400, 409 |
| PUT | `/authors/:id` | Actualizar autor | 200, 400, 404, 409 |
| DELETE | `/authors/:id` | Eliminar autor (y sus posts) | 204, 400, 404 |
| GET | `/posts` | Listar posts | 200 |
| GET | `/posts/:id` | Detalle de un post | 200, 400, 404 |
| GET | `/posts/author/:authorId` | Posts de un autor con los datos del autor | 200, 400, 404 |
| POST | `/posts` | Crear post | 201, 400, 404 |
| PUT | `/posts/:id` | Actualizar post | 200, 400, 404 |
| DELETE | `/posts/:id` | Eliminar post | 204, 400, 404 |
| GET | `/health` | Ver si el servidor está funcionando | 200 |

**Validaciones:**

- `name` es obligatorio, tiene que ser texto, no puede estar vacío (máx. 100 caracteres).
- `email` es obligatorio, con formato válido y **único** (si se repite → `409`).
- `title`, `content` y `author_id` son obligatorios para crear un post.
- `author_id` tiene que ser de un autor que exista (si no → `404`).
- `published` es opcional, pero si viene tiene que ser `true` o `false`.
- Los ids tienen que ser números enteros positivos (si no → `400`).
- En los `PUT` todos los campos son opcionales: solo se cambia lo que se manda.

Todos los errores tienen el mismo formato:

```json
{ "error": "Autor no encontrado", "status": 404 }
```

**Ejemplo - crear un post:**

```http
POST /posts
Content-Type: application/json

{
  "title": "Mi primer post",
  "content": "Hola mundo",
  "author_id": 1,
  "published": false
}
```

Respuesta `201`:

```json
{
  "id": 6,
  "title": "Mi primer post",
  "content": "Hola mundo",
  "author_id": 1,
  "published": false,
  "created_at": "2026-10-28T19:12:11.611Z"
}
```

---

## Cómo ejecutarlo en local

### Requisitos

- [Node.js](https://nodejs.org/) 20 o más nuevo
- [PostgreSQL](https://www.postgresql.org/download/) (yo usé la versión 18)
- Git

### 1. Clonar el repo e instalar dependencias

```bash
git clone https://github.com/rodrigoromero01/api-miniblog.git
cd api-miniblog
npm install
```

### 2. Crear las bases de datos

Una para desarrollo y otra solo para los tests:

```bash
psql -U postgres -c "CREATE DATABASE miniblog;"
psql -U postgres -c "CREATE DATABASE miniblog_test;"
```

### 3. Configurar las variables de entorno

Copiar `.env.example` como `.env` y completar con tu usuario y contraseña de PostgreSQL:

```bash
cp .env.example .env
```

```env
# PORT
PORT=3000

# POSTGRES
# formato: postgresql://usuario:password@host:puerto/nombre_db
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/miniblog

# base de datos solo para los tests (se borra en cada test, NO usar la misma que DATABASE_URL)
TEST_DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/miniblog_test
```

> El archivo `.env` está en el `.gitignore`, nunca se sube a GitHub.

### 4. Crear las tablas y cargar los datos de ejemplo

```bash
psql -U postgres -d miniblog -f src/db/setup.sql
psql -U postgres -d miniblog -f src/db/seed.sql
```

Esto crea 3 autores y 5 posts. Para comprobar que la app se conecta bien:

```bash
npm run db:test
# ✅ Conectado! Hora del servidor: ...
# Autores: 3 | Posts: 5
```

> `setup.sql` empieza con `DROP TABLE IF EXISTS`, así que correrlo de nuevo deja la base vacía. Sirve para "resetear" la base.

### 5. Levantar el servidor

```bash
npm run dev     # con --watch, se reinicia solo al guardar cambios
# o
npm start
```

La API queda en `http://localhost:3000`. Para probar: `http://localhost:3000/health` → `{ "status": "ok" }`

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm start` | Levanta el servidor |
| `npm run dev` | Levanta el servidor y lo reinicia al guardar cambios |
| `npm test` | Corre todos los tests una vez |
| `npm run test:watch` | Deja los tests corriendo mientras programo |
| `npm run db:test` | Prueba la conexión a la base de datos |

---

## Tests

```bash
npm test
```

```
 Test Files  3 passed (3)
      Tests  44 passed (44)
```

- `tests/authors.test.js` → endpoints de autores (15 tests)
- `tests/posts.test.js` → endpoints de posts, `/health` y rutas inexistentes (17 tests)
- `tests/validators.test.js` → tests unitarios de las funciones de validación (12 tests)

Los tests de endpoints usan **supertest** contra la app real y la base `miniblog_test`. Antes de cada test se corren `setup.sql` y `seed.sql`, así cada test arranca con los mismos datos y no depende de los demás.

> Los tests **no tocan** la base de desarrollo: `vitest.config.js` reemplaza `DATABASE_URL` por `TEST_DATABASE_URL`, y si esa variable no existe no corre nada.

---

## Documentación OpenAPI

La documentación está en [`src/docs/openapi.yaml`](src/docs/openapi.yaml) y se puede ver con Swagger UI:

```bash
npm run dev
```

Abrir **http://localhost:3000/api-docs**. Ahí están todos los endpoints con sus parámetros, ejemplos y respuestas, y se pueden probar con el botón **"Try it out"**.

---

## Deploy en Railway

_Esta sección la completo cuando haga el deploy._

---

## Registro del uso de IA

> ✏️ _Borrador: revisar y completar con mis palabras antes de entregar._

### Herramienta usada

Usé **Claude Code** (un asistente de IA que trabaja en la terminal y puede leer y escribir archivos del proyecto) como apoyo durante todo el desarrollo.

### Cómo lo usé

Trabajé paso a paso, siguiendo el orden que recomienda la guía del proyecto. En cada paso le pedía que avance, revisaba lo que había hecho, lo probaba y recién ahí seguía con el siguiente. Cada paso quedó en un commit separado y documentado en [`BITACORA.md`](BITACORA.md).

### Prompts principales

| Momento | Prompt (resumido) | Cómo influyó |
|---|---|---|
| Inicio | _"Te dejo el link de la consigna, leela, tomá el contexto y proponeme cómo comenzamos. Tiene que quedar como el desarrollo de un junior principiante e ir documentando cada paso."_ | Leyó la consigna, el entregable y la guía, y propuso un plan de 8 pasos siguiendo el orden de la guía (SQL → arrays en memoria → PostgreSQL → validaciones → tests → OpenAPI → deploy). |
| Referencia | _"Chequeá también este repo donde se hicieron los ejemplos de clase, tenelo como ejemplo."_ | Revisó el repo de las clases y adaptó el proyecto a esa misma estructura y estilo (ES Modules, `config.js` con `Pool`, `errors.js`, `errorHandler`, vitest + supertest, Swagger con yamljs). |
| Cada paso | _"Seguí con el paso N"_ | Generó el código de cada paso, lo probó con requests reales y documentó el resultado en la bitácora. |
| Problema con PostgreSQL | No me acordaba la contraseña del usuario `postgres`. | Me explicó cómo resetearla editando temporalmente `pg_hba.conf`, y cuando cambié las líneas equivocadas (las de `replication`) detectó el error revisando el archivo. |
| Tests | Usar una base aparte para los tests. | Propuso crear `miniblog_test` porque los tests borran las tablas, para no perder los datos de desarrollo. |
| GitHub | _"Creá el repo, que quede público."_ | Antes de subir revisó que el `.env` y la contraseña no estuvieran en ningún commit. |

### Qué aprendí / qué verifiqué yo

- Revisé que la estructura fuera la misma que vimos en clase y que entiendo cada capa (routes, controllers, services).
- Probé los endpoints y corrí los tests en mi máquina.
- Cosas que entendí gracias a los problemas que aparecieron:
  - En Express el orden de las rutas importa (`/author/:authorId` tiene que ir antes que `/:id`).
  - En Express 5, si no viene body, `req.body` es `undefined`.
  - Los códigos de error de PostgreSQL (`23505` = UNIQUE, `23503` = FOREIGN KEY) se pueden usar para responder 409 y 404.
  - Las consultas tienen que ser parametrizadas (`$1`, `$2`) para evitar SQL injection.
  - Para los tests conviene una base separada.
