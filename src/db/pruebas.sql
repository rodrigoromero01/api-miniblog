-- Consultas que usé para probar las tablas a mano antes de conectar Express
-- Se corren con: psql -U postgres -d miniblog -f src/db/pruebas.sql

-- READ
SELECT * FROM authors;
SELECT * FROM posts;
SELECT * FROM authors WHERE id = 1;

-- posts con los datos de su autor (JOIN)
SELECT p.id, p.title, a.name AS author_name, a.email AS author_email
FROM posts p
JOIN authors a ON a.id = p.author_id
WHERE p.author_id = 1;

-- CREATE
INSERT INTO authors (name, email, bio) VALUES ('Prueba', 'prueba@example.com', 'autor de prueba') RETURNING *;

-- UPDATE
UPDATE authors SET bio = 'bio actualizada' WHERE email = 'prueba@example.com' RETURNING *;

-- email repetido -> tiene que dar error de UNIQUE
-- INSERT INTO authors (name, email) VALUES ('Otra', 'ana@example.com');

-- post con un autor que no existe -> tiene que dar error de FOREIGN KEY
-- INSERT INTO posts (title, content, author_id) VALUES ('x', 'x', 999);

-- DELETE
DELETE FROM authors WHERE email = 'prueba@example.com' RETURNING *;
