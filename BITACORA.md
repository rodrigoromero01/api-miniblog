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
