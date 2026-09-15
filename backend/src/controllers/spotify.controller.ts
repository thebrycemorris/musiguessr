import type { Request, Response } from "express";

import db from "../config/database.js";

import {
  getRecommendations,
  getNewReleaseTracks,
  getRecentArtistReleases,
  searchSpotifyTracks,
  getTopTracks,
  refreshSpotifyToken,
} from "../services/spotify.service.js";

type SpotifyTokenRow = {
  user_id: number;
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
};

export const getAccessToken = (
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

  const tokenRow = db
    .prepare(`
      SELECT
        access_token,
        expires_at
      FROM spotify_tokens
      WHERE user_id = ?
    `)
    .get(userId) as
    | {
        access_token: string;
        expires_at: number;
      }
    | undefined;

  if (!tokenRow) {
    return res.status(404).json({
      success: false,
      error: {
        message: "Spotify token not found",
      },
    });
  }

  return res.json({
    success: true,
    data: {
      accessToken: tokenRow.access_token,
    },
  });
};

export const playTrack = async (
  req: Request,
  res: Response
) => {
  const {
    userId,
    deviceId,
    trackUri,
  } = req.body;

  if (!userId || !deviceId || !trackUri) {
    return res.status(400).json({
      success: false,
      error: {
        message:
          "userId, deviceId, and trackUri are required",
      },
    });
  }

  try {
    const tokenRow = db
      .prepare(`
        SELECT access_token
        FROM spotify_tokens
        WHERE user_id = ?
      `)
      .get(userId) as
      | {
          access_token: string;
        }
      | undefined;

    if (!tokenRow) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Spotify token not found",
        },
      });
    }

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(
        deviceId
      )}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${tokenRow.access_token}`,

          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          uris: [trackUri],
          position_ms: 0,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();

      console.error(
        "Spotify playback error:",
        errorData
      );

      return res.status(response.status).json({
        success: false,
        error: {
          message:
            "Spotify could not start playback",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(
      "Play track error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        message:
          "Failed to start Spotify playback",
      },
    });
  }
};

const getSpotifyAccessToken = async (
  userId: number
): Promise<string> => {
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
    throw new Error("Spotify tokens not found for user");
  }

  let accessToken = tokenRow.access_token;

  if (Date.now() >= tokenRow.expires_at) {
    if (!tokenRow.refresh_token) {
      throw new Error("Spotify refresh token not available");
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

  return accessToken;
};

const mapSpotifyTracks = (tracks: any[]) =>
  tracks
    .filter((track) => track && track.name && track.uri)
    .map((track) => ({
      id: track.id,
      name: track.name,
      artist:
        track.artists
          ?.map((artist: { name: string }) => artist.name)
          .join(", ") ?? "Unknown artist",
      album: track.album?.name ?? "Unknown album",
      image: track.album?.images?.[0]?.url ?? null,
      uri: track.uri,
    }));

export const getDiscoverTracks = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ success: false, error: { message: "Missing userId" } });
  }

  try {
    const accessToken = await getSpotifyAccessToken(userId);
    let tracks;

    try {
      tracks = await getNewReleaseTracks(accessToken);

      if (tracks.length === 0) {
        tracks = await getRecentArtistReleases(accessToken);
      }
    } catch (releaseError) {
      console.error(
        "Recent releases unavailable, using personalized Spotify tracks:",
        releaseError
      );
      const fallbackTracks = await getTopTracks(accessToken, "short_term", 25);
      tracks = fallbackTracks.items;
    }

    return res.json({ success: true, data: { tracks: mapSpotifyTracks(tracks) } });
  } catch (error) {
    console.error("Discover releases error:", error);
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : "Failed to load new releases" },
    });
  }
};

export const searchDiscoverTracks = async (req: Request, res: Response) => {
  const userId = Number(req.query.userId);
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!userId || !query) {
    return res.status(400).json({
      success: false,
      error: { message: "userId and search query are required" },
    });
  }

  try {
    const accessToken = await getSpotifyAccessToken(userId);
    const tracks = await searchSpotifyTracks(accessToken, query);
    return res.json({ success: true, data: { tracks: mapSpotifyTracks(tracks) } });
  } catch (error) {
    console.error("Discover search error:", error);
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : "Failed to search Spotify" },
    });
  }
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
    const accessToken = await getSpotifyAccessToken(userId);
    const spotifyData = await getTopTracks(accessToken);

    return res.json({
      success: true,
      data: {
        tracks: mapSpotifyTracks(spotifyData.items),
      },
    });
  } catch (error) {
    console.error("Top tracks error:", error);

    return res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load Spotify top tracks",
      },
    });
  }
};

export const getUserRecommendations = async (
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
    const accessToken = await getSpotifyAccessToken(userId);

    let trackPool: any[] = [];

    try {
      const recommendationData = await getRecommendations(accessToken);
      const shortTermData = await getTopTracks(accessToken, "short_term", 25);
      const mediumTermData = await getTopTracks(accessToken, "medium_term", 25);
      const longTermData = await getTopTracks(accessToken, "long_term", 25);

      trackPool = [
        ...recommendationData.tracks,
        ...shortTermData.items,
        ...mediumTermData.items,
        ...longTermData.items,
      ];
    } catch (recommendationError) {
      console.error(
        "Recommendations request failed, falling back to larger top-track pool:",
        recommendationError
      );

      const [shortTermData, mediumTermData, longTermData] = await Promise.all([
        getTopTracks(accessToken, "short_term", 25),
        getTopTracks(accessToken, "medium_term", 25),
        getTopTracks(accessToken, "long_term", 25),
      ]);

      trackPool = [
        ...shortTermData.items,
        ...mediumTermData.items,
        ...longTermData.items,
      ];
    }

    const dedupedTrackPool = [
      ...new Map(
        trackPool
          .filter((track) => track && track.name && track.uri)
          .map((track) => [track.name.toLowerCase(), track])
      ).values(),
    ];

    return res.json({
      success: true,
      data: {
        tracks: mapSpotifyTracks(dedupedTrackPool),
      },
    });
  } catch (error) {
    console.error("Recommendations error:", error);

    return res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Failed to load Spotify recommendations",
      },
    });
  }
};