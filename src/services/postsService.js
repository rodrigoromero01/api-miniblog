import pool from "../db/config.js";

export const getAllPostsService = async () => {
  const result = await pool.query("SELECT * FROM posts ORDER BY id");
  return result.rows;
};

export const getPostByIdService = async (id) => {
  const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
  return result.rows[0];
};

export const getPostsByAuthorService = async (authorId) => {
  // JOIN para traer cada post con los datos de su autor
  const result = await pool.query(
    `SELECT p.id, p.title, p.content, p.published, p.created_at, p.author_id,
            a.name  AS author_name,
            a.email AS author_email,
            a.bio   AS author_bio
     FROM posts p
     JOIN authors a ON a.id = p.author_id
     WHERE p.author_id = $1
     ORDER BY p.id`,
    [authorId],
  );
  return result.rows;
};

export const createPostService = async (title, content, authorId, published) => {
  const result = await pool.query(
    `INSERT INTO posts (title, content, author_id, published)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, content, authorId, published ?? false],
  );
  return result.rows[0];
};

export const updatePostService = async (id, title, content, published) => {
  const result = await pool.query(
    `UPDATE posts
     SET title     = COALESCE($1, title),
         content   = COALESCE($2, content),
         published = COALESCE($3, published)
     WHERE id = $4
     RETURNING *`,
    [title ?? null, content ?? null, published ?? null, id],
  );
  return result.rows[0];
};

export const deletePostService = async (id) => {
  const result = await pool.query("DELETE FROM posts WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
};
