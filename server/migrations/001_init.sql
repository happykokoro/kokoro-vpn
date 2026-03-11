CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    username        TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at      TEXT,
    bandwidth_limit_bytes INTEGER,
    bandwidth_used_bytes  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS devices (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    public_key  TEXT UNIQUE NOT NULL,
    private_key TEXT NOT NULL,
    address     TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen   TEXT
);

CREATE TABLE IF NOT EXISTS server_profiles (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    endpoint    TEXT NOT NULL,
    public_key  TEXT NOT NULL,
    dns         TEXT NOT NULL DEFAULT '1.1.1.1,8.8.8.8',
    allowed_ips TEXT NOT NULL DEFAULT '0.0.0.0/0,::/0',
    is_active   INTEGER NOT NULL DEFAULT 1
);
