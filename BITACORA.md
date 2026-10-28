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

---

## Paso 3 - Endpoints con arrays en memoria

Como recomienda la guía, primero hice todos los endpoints sin base de datos, usando arrays. Así pruebo que las rutas y los códigos HTTP están bien antes de meter SQL.

**Qué hice:**

- `src/data/memoria.js`: los arrays `authors` y `posts` con los mismos datos del seed. Los puse en un archivo aparte porque los controllers de posts necesitan buscar autores.
- `src/controllers/authorsController.js` y `postsController.js`: la lógica de cada endpoint.
- `src/routes/authorsRouter.js`, `postsRouter.js` e `indexRouter.js`: definen las rutas.
- En `app.js` agregué `app.use(router)`.

**Endpoints:**

| Método | Ruta | Qué hace | Códigos |
|---|---|---|---|
| GET | /authors | lista autores | 200 |
| GET | /authors/:id | detalle de autor | 200, 400, 404 |
| POST | /authors | crea autor | 201, 400, 409 |
| PUT | /authors/:id | actualiza autor | 200, 400, 404, 409 |
| DELETE | /authors/:id | borra autor (y sus posts) | 204, 404 |
| GET | /posts | lista posts | 200 |
| GET | /posts/:id | detalle de post | 200, 400, 404 |
| GET | /posts/author/:authorId | posts de un autor con los datos del autor | 200, 404 |
| POST | /posts | crea post | 201, 400, 404 |
| PUT | /posts/:id | actualiza post | 200, 400, 404 |
| DELETE | /posts/:id | borra post | 204, 404 |

**Cosas que aprendí / decidí:**

- En `postsRouter` la ruta `/author/:authorId` tiene que ir **antes** que `/:id`. Si no, Express toma "author" como si fuera un id.
- Para email repetido devuelvo **409 Conflict** (como en el ejemplo de clase), porque el dato es válido pero choca con otro que ya existe.
- Cuando borro un autor también borro sus posts, para que se comporte igual que el `ON DELETE CASCADE` de la base.
- Los `DELETE` devuelven **204** sin cuerpo.
- En el `PUT` solo cambio los campos que vienen en el body (uso `??` para dejar el valor anterior si no viene).

**Pruebas:** probé los 11 endpoints con casos buenos y con errores (id inexistente, id que no es número, nombre vacío, email repetido, autor que no existe, borrar dos veces lo mismo). Todos devolvieron el código esperado. Al borrar el autor 1 también desaparecieron sus posts (quedaron los posts 2 y 4).

---

## Paso 4 - Conectar los endpoints a PostgreSQL

Reemplacé los arrays por consultas reales a la base.

**Qué hice:**

- `src/services/authorsService.js` y `src/services/postsService.js`: acá están **todas** las consultas SQL. Los controllers ya no tocan la base directamente, solo llaman a los services (routes → controllers → services → db).
- Todas las consultas son **parametrizadas** (`$1`, `$2`, ...). Nunca armo el SQL concatenando strings, así se evita SQL injection.
- Los controllers ahora son `async` y tienen `try/catch`.
- Borré `src/data/memoria.js` porque ya no se usa.

**Detalles:**

- En los `UPDATE` uso `COALESCE($1, name)`: si el campo no viene en el body mando `null` y la base deja el valor que ya tenía.
- Los `DELETE` usan `RETURNING id` y miro `rowCount` para saber si existía (si es 0 → 404).
- `GET /posts/author/:authorId` usa un `JOIN` entre posts y authors y devuelve cada post con `author_name`, `author_email` y `author_bio`. Antes me fijo que el autor exista para devolver 404 si no.
- Ya no busco emails repetidos a mano: dejo que la base lo controle con el `UNIQUE` y atrapo el error. Los códigos de error de Postgres que uso:
  - `23505` → violación de UNIQUE (email repetido) → respondo **409**
  - `23503` → violación de FOREIGN KEY (el autor no existe) → respondo **404**
- Ya no hace falta borrar los posts a mano cuando borro un autor, lo hace el `ON DELETE CASCADE`.

**Pruebas:** corrí las mismas pruebas que en el paso 3, ahora contra la base real, y dieron los mismos códigos. Para dejar la base limpia después de probar vuelvo a correr `setup.sql` y `seed.sql`.

---

## Paso 5 - Validaciones y manejo de errores

Hasta ahora cada controller tenía su propio `try/catch` con `res.status(500)` y validaciones con `if` repetidos. Lo ordené como vimos en clase.

**Qué hice:**

- `src/utils/errors.js`: funciones `badRequest`, `notFound`, `conflict`, que crean un `Error` con su `statusCode`.
- `src/utils/validators.js`: validadores que devuelven un mensaje de error o `null` si está todo bien:
  - `validarId` → tiene que ser un entero positivo (rechaza `abc`, `-1`, `1.5`)
  - `validarTexto` → requerido, que sea string, que no esté vacío y un largo máximo
  - `validarNombre` (máx. 100) y `validarEmail` (máx. 150 + formato con regex)
  - `validarBio` (opcional, pero si viene tiene que ser texto)
  - `validarPublished` (opcional, pero si viene tiene que ser `true` o `false`)
- `src/middlewares/errorHandler.js`: middleware global. Todos los errores llegan acá con `next(error)` y responde siempre con el mismo formato: `{ "error": "...", "status": 400 }`.
  - Traduce los errores de Postgres: `23505` → 409, `23503` → 404, `22P02` → 400.
  - Si el JSON del body está mal escrito responde 400 "El body no es un JSON válido".
  - Si es un 500 no muestra el mensaje real del error al cliente (solo lo loguea en consola).
- `rutaNoEncontrada`: responde 404 para rutas que no existen.
- En `app.js` los dos middlewares van **al final**, después de las rutas.
- Los controllers ahora usan `next(badRequest(...))` / `next(notFound(...))` y en el `catch` solo hacen `next(error)`.

**Problema que encontré:** en Express 5, si el request no trae body, `req.body` es `undefined` y al hacer `const { name } = req.body` explotaba con error 500. Lo solucioné con `req.body || {}`.

**Pruebas:** además de repetir todas las pruebas anteriores (siguen dando lo mismo), probé casos nuevos: nombre numérico, nombre con solo espacios, email sin formato, bio numérica, nombre de 101 caracteres, POST sin body, JSON mal escrito, ids negativos o con decimales, `author_id: "abc"`, `published: "si"`, título como array y una ruta inexistente. Todos devuelven 400 o 404 con un mensaje claro, ninguno da 500.

---

## Paso 6 - Tests con vitest y supertest

**Base de datos para tests:** los tests borran y vuelven a crear las tablas antes de cada test, así que si usaban la misma base que desarrollo me iban a borrar los datos. Por eso creé una base aparte:

```bash
psql -U postgres -c "CREATE DATABASE miniblog_test;"
```

y agregué en el `.env` la variable `TEST_DATABASE_URL` apuntando a `miniblog_test` (también está en `.env.example`).

**Qué hice:**

- `vitest.config.js`:
  - Carga el `.env` y, solo para los tests, cambia `DATABASE_URL` por `TEST_DATABASE_URL`. Así la app no se entera y usa la base de test.
  - Si falta `TEST_DATABASE_URL` tira error y no corre nada (para no borrar la base de desarrollo por accidente).
  - `fileParallelism: false` → los archivos de test corren de a uno, porque comparten la misma base.
- `tests/helpers.js`: función `resetearBase()` que corre `setup.sql` y `seed.sql`. Se llama en el `beforeEach`, así cada test arranca con los mismos 3 autores y 5 posts.
- `tests/authors.test.js` (15 tests): listar, detalle, crear, nombre faltante/vacío, email inválido, email repetido (409), sin body, actualizar, 404, eliminar (y que se borren sus posts), eliminar inexistente.
- `tests/posts.test.js` (17 tests): listar, detalle, posts de un autor con JOIN, crear, sin título / contenido / author_id, autor inexistente, `published` inválido, actualizar, eliminar, eliminar inexistente, `/health` y ruta inexistente.
- `tests/validators.test.js` (12 tests): tests unitarios de las funciones de `validators.js`, sin servidor ni base.
- En `package.json`: `npm test` corre los tests una vez (`vitest run`) y `npm run test:watch` los deja corriendo mientras programo.

**Cómo correrlos:**

```bash
npm test
```

**Resultado:** `Test Files 3 passed (3) | Tests 44 passed (44)`

Para estar seguro de que los tests no tocan la base de desarrollo, inserté un autor "marca" en `miniblog`, corrí los tests y seguía estando. Después lo borré.

Los casos que pide la guía están cubiertos: crear author, obtener author, crear post y eliminar recurso inexistente.

---

## Paso 7 - Documentación OpenAPI (Swagger)

**Qué hice:**

- `src/docs/openapi.yaml`: la documentación de la API en formato OpenAPI 3.1, con:
  - Los 11 endpoints de authors y posts, más `/health`.
  - Para cada uno: qué hace, qué body recibe (con un ejemplo) y todas las respuestas posibles (200, 201, 204, 400, 404, 409, 500).
  - Esquemas reutilizables en `components/schemas`: `Author`, `AuthorInput`, `AuthorUpdate`, `Post`, `PostInput`, `PostUpdate`, `PostConAutor` y `Error`.
  - Respuestas de error reutilizables en `components/responses` (`DatosInvalidos`, `NoEncontrado`, `EmailRepetido`, `ErrorServidor`) para no repetir lo mismo en cada endpoint.
  - El parámetro `id` definido una sola vez en `components/parameters` y referenciado con `$ref`.
- En `app.js` serví la documentación con `swagger-ui-express` y `yamljs` en la ruta `/api-docs`.

**Cómo verla:**

```bash
npm run dev
```

Y abrir en el navegador: `http://localhost:3000/api-docs`. Desde ahí se puede probar cada endpoint con el botón **"Try it out"**.

**Validación:** validé el archivo con `npx @redocly/cli lint`. Con las reglas recomendadas marca errores de "security-defined" porque la API no tiene autenticación (la consigna no la pide). Validándolo solo contra la especificación OpenAPI da **"Your API description is valid"**.

Cuando haga el deploy en Railway voy a agregar la URL pública en `servers`.
