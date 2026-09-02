CREATE TABLE IF NOT EXISTS ai_chat_logs (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT NOT NULL,
    location    TEXT,
    role        TEXT NOT NULL,
    message     TEXT NOT NULL,
    timestamp   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_session ON ai_chat_logs (session_id);
