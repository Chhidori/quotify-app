-- Create conversation_logs table for storing agent conversation transcripts
CREATE TABLE IF NOT EXISTS conversation_logs (
  id SERIAL PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT,
  session_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'agent', 'system')),
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_id ON conversation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_session_id ON conversation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_room_name ON conversation_logs(room_name);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_timestamp ON conversation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_speaker ON conversation_logs(speaker);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_organization_id ON conversation_logs(organization_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_conversation_logs_session_timestamp ON conversation_logs(session_id, timestamp);

-- Add comment
COMMENT ON TABLE conversation_logs IS 'Stores conversation transcripts from LiveKit voice agent sessions';
