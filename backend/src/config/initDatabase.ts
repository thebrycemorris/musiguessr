import db from "./database.js";

export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      email TEXT,
      avatar_url TEXT,
      spotify_profile_url TEXT,
      bio TEXT,
      favorite_genre TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spotify_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
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

    CREATE TABLE IF NOT EXISTS friendships (
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const userColumns = db
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  const existingColumns = new Set(
    userColumns.map((column) => column.name)
  );

  for (const column of [
    "spotify_profile_url",
    "bio",
    "favorite_genre",
  ]) {
    if (!existingColumns.has(column)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
    }
  }

  console.log("Musiguessr database initialized");
};