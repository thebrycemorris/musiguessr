import type { Request, Response } from "express";

import db from "../config/database.js";

import {
  getTopTracks,
  refreshSpotifyToken,
} from "../services/spotify.service.js";

type SpotifyTokenRow = {
  user_id: number;
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
};

export const getUserTopTracks = async (
  req: Request,
  res: Response
) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Missing userId",
      },
    });
  }

  try {
    const tokenRow = db
      .prepare(`
        SELECT
          user_id,
          access_token,
          refresh_token,
          expires_at
        FROM spotify_tokens
        WHERE user_id = ?
      `)
      .get(userId) as SpotifyTokenRow | undefined;

    if (!tokenRow) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Spotify tokens not found for user",
        },
      });
    }

    let accessToken = tokenRow.access_token;

    if (Date.now() >= tokenRow.expires_at) {
      if (!tokenRow.refresh_token) {
        return res.status(401).json({
          success: false,
          error: {
            message: "Spotify refresh token not available",
          },
        });
      }

      const refreshedToken = await refreshSpotifyToken(
        tokenRow.refresh_token
      );

      accessToken = refreshedToken.access_token;

      const expiresAt =
        Date.now() + refreshedToken.expires_in * 1000;

      db.prepare(`
        UPDATE spotify_tokens
        SET
          access_token = ?,
          refresh_token = COALESCE(?, refresh_token),
          expires_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        refreshedToken.access_token,
        refreshedToken.refresh_token ?? null,
        expiresAt,
        userId
      );
    }

    const spotifyData = await getTopTracks(accessToken);

    const tracks = spotifyData.items.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists
        .map((artist) => artist.name)
        .join(", "),
      album: track.album.name,
      image: track.album.images?.[0]?.url ?? null,
      uri: track.uri,
    }));

    return res.json({
      success: true,
      data: {
        tracks,
      },
    });
  } catch (error) {
    console.error("Top tracks error:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to load Spotify top tracks",
      },
    });
  }
};