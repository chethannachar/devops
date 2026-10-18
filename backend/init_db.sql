CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    place_of_birth TEXT,
    password_hash TEXT NOT NULL
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS place_of_birth TEXT;
