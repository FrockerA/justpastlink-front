CREATE TABLE IF NOT EXISTS catalogs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_catalogs_user_name UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_catalogs_user_id ON catalogs(user_id);

CREATE TABLE IF NOT EXISTS catalog_lectures (
    catalog_id BIGINT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
    lecture_id BIGINT NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (catalog_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_lectures_lecture_id
    ON catalog_lectures(lecture_id);
