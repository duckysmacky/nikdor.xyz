CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    service TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    budget INT,
    duration TEXT,
    message TEXT
);
