-- Users have no account: the id is the Ed25519 public key kept in the phone's Keychain.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  apple_sub TEXT UNIQUE,
  google_sub TEXT UNIQUE,
  sub_brushes INTEGER NOT NULL DEFAULT 0,   -- reset to 50 each period, does not roll over
  pack_brushes INTEGER NOT NULL DEFAULT 0,  -- gifts and bought packs, never expire
  sub_ends_at INTEGER,                      -- ms; subscription brushes count only before this
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

-- One row per client request id, so a retried request is charged once.
CREATE TABLE draws (
  request_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bucket TEXT,                              -- sub|pack, the balance the brush came from
  status TEXT NOT NULL,                     -- pending|done|failed
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE brush_moves (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,                     -- sub|pack
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,                     -- gift|draw|refund|compensation|pack|subscription
  ref TEXT,                                 -- request id or store transaction id
  created_at INTEGER NOT NULL
);
CREATE INDEX brush_moves_user ON brush_moves(user_id, reason, created_at);

-- Every Gemini call, failed ones too. Kept after account deletion without the user id.
CREATE TABLE gemini_calls (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,            -- usageMetadata.promptTokenCount
  image_tokens INTEGER NOT NULL,            -- candidatesTokensDetails, modality IMAGE
  text_tokens INTEGER NOT NULL,             -- other output + thoughtsTokenCount
  cost_micros INTEGER NOT NULL,             -- USD x 1,000,000
  duration_ms INTEGER NOT NULL,
  ok INTEGER NOT NULL,                      -- 0: no image came back, the call is still billed
  created_at INTEGER NOT NULL
);
CREATE INDEX gemini_calls_created ON gemini_calls(created_at);
