import db from "./database.js";

export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      email TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      game_mode TEXT NOT NULL DEFAULT 'TOP_TRACKS',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,

      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      spotify_track_id TEXT NOT NULL,
      guessed_track_id TEXT,
      correct INTEGER,
      response_time_ms INTEGER,
      points INTEGER NOT NULL DEFAULT 0,
      round_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (game_id)
        REFERENCES games(id)
        ON DELETE CASCADE,

      UNIQUE(game_id, round_number)
    );
  `);

  console.log("Musiguessr database initialized");
};