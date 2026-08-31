CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'finished')) DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  chips_amount INTEGER,
  cash_amount_cents INTEGER
);

CREATE TABLE IF NOT EXISTS game_players (
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  PRIMARY KEY (game_id, player_id)
);

CREATE TABLE IF NOT EXISTS hands (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,
  variant TEXT NOT NULL DEFAULT 'Poker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  UNIQUE (game_id, hand_number)
);

CREATE TABLE IF NOT EXISTS hand_results (
  id SERIAL PRIMARY KEY,
  hand_id INTEGER NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  amount INTEGER NOT NULL,
  UNIQUE (hand_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_hands_game ON hands(game_id);
CREATE INDEX IF NOT EXISTS idx_hands_variant ON hands(variant);
CREATE INDEX IF NOT EXISTS idx_hand_results_hand ON hand_results(hand_id);
CREATE INDEX IF NOT EXISTS idx_hand_results_player ON hand_results(player_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player ON game_players(player_id);
