CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress','finished')) DEFAULT 'in_progress',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS game_players (
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  PRIMARY KEY (game_id, player_id)
);

CREATE TABLE IF NOT EXISTS hands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  UNIQUE (game_id, hand_number)
);

CREATE TABLE IF NOT EXISTS hand_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hand_id INTEGER NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  amount INTEGER NOT NULL,
  UNIQUE (hand_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_hands_game ON hands(game_id);
CREATE INDEX IF NOT EXISTS idx_hand_results_hand ON hand_results(hand_id);
CREATE INDEX IF NOT EXISTS idx_hand_results_player ON hand_results(player_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player ON game_players(player_id);
