import fs from "fs";
import pool from "../src/db/config.js";

const setupSql = fs.readFileSync("src/db/setup.sql", "utf8");
const seedSql = fs.readFileSync("src/db/seed.sql", "utf8");

// Deja la base de test como recién creada: tablas nuevas + datos del seed
// (3 autores y 5 posts). Se usa en el beforeEach de cada archivo de test.
export async function resetearBase() {
  await pool.query("SET client_min_messages TO WARNING"); // oculta los NOTICE del DROP TABLE
  await pool.query(setupSql);
  await pool.query(seedSql);
}
