import "dotenv/config";
import pool from "./config.js";

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Conectado! Hora del servidor:", result.rows[0].now);

    const authors = await pool.query("SELECT COUNT(*) FROM authors");
    const posts = await pool.query("SELECT COUNT(*) FROM posts");
    console.log("Autores:", authors.rows[0].count, "| Posts:", posts.rows[0].count);
  } catch (error) {
    console.error("❌ Error conectando:", error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
