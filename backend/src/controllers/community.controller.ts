import type { Request, Response } from "express";
import db from "../config/database.js";

export const getGlobalLeaderboard = (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT
      games.id,
      games.score,
      games.completed_at AS completedAt,
      users.id AS userId,
      users.display_name AS displayName,
      users.avatar_url AS avatarUrl
    FROM games
    JOIN users ON users.id = games.user_id
    WHERE games.completed_at IS NOT NULL
    ORDER BY games.score DESC, games.completed_at ASC
    LIMIT 100
  `).all();

  return res.json({ success: true, data: { entries: rows } });
};

export const searchUsers = (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!query) {
    return res.json({ success: true, data: { users: [] } });
  }

  const users = db.prepare(`
    SELECT id, display_name AS displayName, avatar_url AS avatarUrl, bio
    FROM users
    WHERE display_name LIKE ? OR spotify_id LIKE ?
    ORDER BY display_name COLLATE NOCASE
    LIMIT 30
  `).all(`%${query}%`, `%${query}%`);

  return res.json({ success: true, data: { users } });
};

export const getUserProfile = (req: Request, res: Response) => {
  const user = db.prepare(`
    SELECT id, display_name AS displayName, avatar_url AS avatarUrl,
      bio, favorite_genre AS favoriteGenre, created_at AS createdAt
    FROM users WHERE id = ?
  `).get(Number(req.params.userId));

  if (!user) {
    return res.status(404).json({ success: false, error: { message: "User not found" } });
  }

  return res.json({ success: true, data: { user } });
};

export const addFriend = (req: Request, res: Response) => {
  const userId = Number(req.body.userId);
  const friendId = Number(req.body.friendId);

  if (!userId || !friendId || userId === friendId) {
    return res.status(400).json({ success: false, error: { message: "Valid users are required" } });
  }

  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(userId, friendId);
  db.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)").run(friendId, userId);

  return res.json({ success: true });
};

export const getFriends = (req: Request, res: Response) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: { message: "Missing userId" },
    });
  }

  const friends = db.prepare(`
    SELECT
      users.id,
      users.display_name AS displayName,
      users.avatar_url AS avatarUrl,
      users.bio
    FROM friendships
    JOIN users ON users.id = friendships.friend_id
    WHERE friendships.user_id = ?
    ORDER BY users.display_name COLLATE NOCASE
  `).all(userId);

  return res.json({ success: true, data: { friends } });
};

export const saveGameResult = (req: Request, res: Response) => {
  const { userId, score, gameMode = "TOP_TRACKS", completedAt } = req.body as {
    userId?: number;
    score?: number;
    gameMode?: string;
    completedAt?: string;
  };

  if (!userId || typeof score !== "number") {
    return res.status(400).json({
      success: false,
      error: { message: "userId and score are required" },
    });
  }

  const result = db.prepare(`
    INSERT INTO games (user_id, score, game_mode, completed_at)
    VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
  `).run(userId, score, gameMode, completedAt ?? null);

  return res.status(201).json({ success: true, data: { gameId: result.lastInsertRowid } });
};