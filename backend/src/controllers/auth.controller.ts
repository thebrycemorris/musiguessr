import type { Request, Response } from "express";

import { env } from "../config/env.js";
import db from "../config/database.js";

import {
  exchangeCodeForTokens,
  getSpotifyProfile,
} from "../services/spotify.service.js";

export const loginWithSpotify = (_req: Request, res: Response) => {
  const scopes = [
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "user-library-read",
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
        display_name = excluded.display_name,
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
          created_at
        FROM users
        WHERE spotify_id = ?
      `)
      .get(profile.id);

    return res.redirect(
  `${env.frontendUrl}?login=success&user=${encodeURIComponent(
    JSON.stringify(user)
  )}`
);
  } catch (error) {
    console.error("Spotify callback error:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Spotify authentication failed",
      },
    });
  }
};