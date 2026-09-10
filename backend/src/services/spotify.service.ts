import { env } from "../config/env.js";

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyProfile {
  id: string;
  display_name: string | null;
  email?: string;
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

export const exchangeCodeForTokens = async (
  code: string
): Promise<SpotifyTokenResponse> => {
  const credentials = Buffer.from(
    `${env.spotifyClientId}:${env.spotifyClientSecret}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: env.spotifyRedirectUri,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();

    console.error("Spotify token error:", errorData);

    throw new Error("Failed to exchange Spotify authorization code");
  }

  return (await response.json()) as SpotifyTokenResponse;
};

export const getSpotifyProfile = async (
  accessToken: string
): Promise<SpotifyProfile> => {
  const response = await fetch(
    "https://api.spotify.com/v1/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();

    console.error("Spotify profile error:", errorData);

    throw new Error("Failed to fetch Spotify profile");
  }

  return (await response.json()) as SpotifyProfile;
};