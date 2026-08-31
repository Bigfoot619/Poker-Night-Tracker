ALTER TABLE hands ADD COLUMN variant TEXT NOT NULL DEFAULT 'Poker';
CREATE INDEX IF NOT EXISTS idx_hands_variant ON hands(variant);
