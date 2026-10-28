-- Borro las tablas si ya existen para poder correr el script de nuevo
-- (primero posts porque depende de authors)
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS authors;

CREATE TABLE authors (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  bio        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  content    TEXT NOT NULL,
  author_id  INTEGER NOT NULL,
  published  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- si se borra un autor se borran sus posts
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- indice para buscar rapido los posts de un autor (GET /posts/author/:authorId)
CREATE INDEX idx_posts_author_id ON posts(author_id);
