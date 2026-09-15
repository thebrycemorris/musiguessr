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

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number | null;
      width: number | null;
    }>;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
}

export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

type SpotifyAlbum = {
  id: string;
  name: string;
  release_date: string;
  images: SpotifyTrack["album"]["images"];
  artists: SpotifyTrack["artists"];
};

type SpotifyAlbumResponse = {
  items: SpotifyAlbum[];
};

type SpotifyAlbumTracksResponse = {
  items: Array<{
    id: string;
    name: string;
    uri: string;
    artists: SpotifyTrack["artists"];
  }>;
};

type SpotifySearchResponse = {
  tracks: {
    items: SpotifyTrack[];
  };
};

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[];
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

export const refreshSpotifyToken = async (
  refreshToken: string
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
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();

    console.error("Spotify refresh token error:", errorData);

    throw new Error("Failed to refresh Spotify access token");
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

export const getTopTracks = async (
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit = 20
): Promise<SpotifyTopTracksResponse> => {
  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();

    console.error("Spotify top tracks error:", errorData);

    throw new Error("Failed to fetch Spotify top tracks");
  }

  return (await response.json()) as SpotifyTopTracksResponse;
};

export const getTopArtists = async (
  accessToken: string
): Promise<SpotifyTopArtistsResponse> => {
  const response = await fetch(
    "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();

    console.error("Spotify top artists error:", errorData);

    throw new Error("Failed to fetch Spotify top artists");
  }

  return (await response.json()) as SpotifyTopArtistsResponse;
};

const spotifyRequest = async <T>(url: string, accessToken: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Spotify catalog request error:", errorData);
    throw new Error("Failed to load Spotify catalog data");
  }

  return (await response.json()) as T;
};

export const getRecentArtistReleases = async (
  accessToken: string
): Promise<SpotifyTrack[]> => {
  const artists = await getTopArtists(accessToken);
  const topArtists = artists.items.slice(0, 5);
  const releaseGroups = await Promise.all(
    topArtists.map(async (artist) => {
      const albums = await spotifyRequest<SpotifyAlbumResponse>(
        `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=3&market=US`,
        accessToken
      );

      return Promise.all(
        albums.items.slice(0, 2).map(async (album) => {
          const tracks = await spotifyRequest<SpotifyAlbumTracksResponse>(
            `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=3&market=US`,
            accessToken
          );

          return tracks.items.map((track) => ({
            ...track,
            album: {
              name: album.name,
              images: album.images,
            },
          }));
        })
      );
    })
  );

  return releaseGroups.flat(2).sort((first, second) =>
    second.album.name.localeCompare(first.album.name)
  );
};

export const searchSpotifyTracks = async (
  accessToken: string,
  query: string
): Promise<SpotifyTrack[]> => {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "10",
    market: "US",
  });
  const data = await spotifyRequest<SpotifySearchResponse>(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    accessToken
  );

  return data.tracks.items;
};

export const getNewReleaseTracks = async (
  accessToken: string
): Promise<SpotifyTrack[]> => {
  const artistData = await getTopArtists(accessToken);
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];
  const artistQueries = artistData.items
    .slice(0, 3)
    .map((artist) => artist.name.replace(/"/g, "").trim())
    .filter(Boolean);

  const results = await Promise.allSettled(
    artistQueries.flatMap((artist) =>
      years.map((year) =>
        searchSpotifyTracks(
          accessToken,
          `artist:"${artist}" year:${year}`
        )
      )
    )
  );

  const tracks = results
    .filter(
      (result): result is PromiseFulfilledResult<SpotifyTrack[]> =>
        result.status === "fulfilled"
    )
    .flatMap((result) => result.value);

  return [
    ...new Map(
      tracks.map((track) => [track.id, track])
    ).values(),
  ];
};

export const getRecommendations = async (
  accessToken: string
): Promise<SpotifyRecommendationsResponse> => {
  const [artistData, shortTermTracks, mediumTermTracks] = await Promise.all([
    getTopArtists(accessToken),
    getTopTracks(accessToken, "short_term", 25),
    getTopTracks(accessToken, "medium_term", 25),
  ]);

  const artistSeeds = artistData.items
    .slice(0, 5)
    .map((artist) => artist.id)
    .filter(Boolean);

  const trackSeeds = [
    ...new Set(
      [...shortTermTracks.items, ...mediumTermTracks.items]
        .slice(0, 25)
        .map((track) => track.id)
        .filter(Boolean)
    ),
  ].slice(0, 5);

  if (artistSeeds.length === 0 && trackSeeds.length === 0) {
    throw new Error(
      "Not enough Spotify listening history for recommendations"
    );
  }

  const selectedTrackSeeds = trackSeeds.slice(0, 2);
  const remainingSeedSlots = 5 - selectedTrackSeeds.length;
  const selectedArtistSeeds = artistSeeds.slice(
    0,
    Math.max(0, remainingSeedSlots)
  );

  const params = new URLSearchParams({
    limit: "40",
  });

  if (selectedTrackSeeds.length > 0) {
    params.set("seed_tracks", selectedTrackSeeds.join(","));
  }

  if (selectedArtistSeeds.length > 0) {
    params.set("seed_artists", selectedArtistSeeds.join(","));
  }

  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();

    console.error("Spotify recommendations error:", errorData);

    throw new Error("Failed to fetch Spotify recommendations");
  }

  return (await response.json()) as SpotifyRecommendationsResponse;
};
