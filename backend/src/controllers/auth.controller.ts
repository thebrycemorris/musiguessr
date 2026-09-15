import type { Request, Response } from "express";

import { env } from "../config/env.js";
import db from "../config/database.js";

import {
  exchangeCodeForTokens,
  getSpotifyProfile,
} from "../services/spotify.service.js";

type DatabaseUser = {
  id: number;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  spotify_profile_url: string | null;
  bio: string | null;
  favorite_genre: string | null;
  created_at: string;
};

export const loginWithSpotify = (_req: Request, res: Response) => {
  const scopes = [
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "user-library-read",
    "streaming",
    "user-modify-playback-state",
  ];

  const params = new URLSearchParams({
    client_id: env.spotifyClientId,
    response_type: "code",
    redirect_uri: env.spotifyRedirectUri,
    scope: scopes.join(" "),
  });

  const spotifyAuthUrl =
    `https://accounts.spotify.com/authorize?${params.toString()}`;

  res.redirect(spotifyAuthUrl);
};

export const spotifyCallback = async (
  req: Request,
  res: Response
) => {
  const code = req.query.code;

  if (!code || typeof code !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Missing Spotify authorization code",
      },
    });
  }

  try {
    const tokenData = await exchangeCodeForTokens(code);

    const profile = await getSpotifyProfile(
      tokenData.access_token
    );

    const userStatement = db.prepare(`
      INSERT INTO users (
        spotify_id,
        display_name,
        email,
        avatar_url
      )
      VALUES (?, ?, ?, ?)

      ON CONFLICT(spotify_id)
      DO UPDATE SET
        display_name = COALESCE(users.display_name, excluded.display_name),
        email = excluded.email,
        avatar_url = excluded.avatar_url
    `);

    userStatement.run(
      profile.id,
      profile.display_name ?? null,
      profile.email ?? null,
      profile.images?.[0]?.url ?? null
    );

    const user = db
      .prepare(`
        SELECT
          id,
          spotify_id,
          display_name,
          email,
          avatar_url,
          spotify_profile_url,
          bio,
          favorite_genre,
          created_at
        FROM users
        WHERE spotify_id = ?
      `)
      .get(profile.id) as DatabaseUser;

    const expiresAt =
      Date.now() + tokenData.expires_in * 1000;

    const tokenStatement = db.prepare(`
      INSERT INTO spotify_tokens (
        user_id,
        access_token,
        refresh_token,
        expires_at
      )
      VALUES (?, ?, ?, ?)

      ON CONFLICT(user_id)
      DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = COALESCE(
          excluded.refresh_token,
          spotify_tokens.refresh_token
        ),
        expires_at = excluded.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `);

    tokenStatement.run(
      user.id,
      tokenData.access_token,
      tokenData.refresh_token ?? null,
      expiresAt
    );

    return res.redirect(
      `${env.frontendUrl}/dashboard?login=success&user=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    );
  } catch (error) {
    console.error(
      "Spotify callback error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        message: "Spotify authentication failed",
      },
    });
  }
};

export const updateProfile = (req: Request, res: Response) => {
  const { userId, display_name, avatar_url, spotify_profile_url, bio, favorite_genre } =
    req.body as {
      userId?: number;
      display_name?: string;
      avatar_url?: string;
      spotify_profile_url?: string;
      bio?: string;
      favorite_genre?: string;
    };

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: { message: "Missing user id" },
    });
  }

  const result = db
    .prepare(`
      UPDATE users
      SET display_name = ?,
          avatar_url = ?,
          spotify_profile_url = ?,
          bio = ?,
          favorite_genre = ?
      WHERE id = ?
    `)
    .run(
      display_name ?? null,
      avatar_url ?? null,
      spotify_profile_url ?? null,
      bio ?? null,
      favorite_genre ?? null,
      userId
    );

  if (result.changes === 0) {
    return res.status(404).json({
      success: false,
      error: { message: "User not found" },
    });
  }

  const user = db
    .prepare(`
      SELECT
        id,
        spotify_id,
        display_name,
        email,
        avatar_url,
        spotify_profile_url,
        bio,
        favorite_genre,
        created_at
      FROM users
      WHERE id = ?
    `)
    .get(userId);

  return res.json({ success: true, user });
};