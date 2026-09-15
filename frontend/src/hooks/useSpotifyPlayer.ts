import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

type PlayerState = {
  deviceId: string | null;
  ready: boolean;
  error: string | null;
};

type SpotifyPlayerContextValue = {
  player: SpotifyPlayer | null;
  deviceId: string | null;
  ready: boolean;
  error: string | null;
};

const SpotifyContext =
  createContext<SpotifyPlayerContextValue>({
    player: null,
    deviceId: null,
    ready: false,
    error: null,
  });

const getStoredUserId = () => {
  const storedUser =
    localStorage.getItem("musiguessr_user");

  if (!storedUser) {
    return undefined;
  }

  try {
    const user = JSON.parse(storedUser) as {
      id?: number;
    };

    return typeof user?.id === "number"
      ? user.id
      : undefined;
  } catch {
    return undefined;
  }
};

export const SpotifyProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [player, setPlayer] =
    useState<SpotifyPlayer | null>(null);

  const [state, setState] =
    useState<PlayerState>({
      deviceId: null,
      ready: false,
      error: null,
    });

  const [userId, setUserId] =
    useState<number | undefined>(() =>
      getStoredUserId()
    );

  const playerRef =
    useRef<SpotifyPlayer | null>(null);
  const activeUserIdRef =
    useRef<number | undefined>(undefined);

  useEffect(() => {
    const syncUser = () => {
      setUserId(getStoredUserId());
    };

    syncUser();
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(
        "storage",
        syncUser
      );
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }

      activeUserIdRef.current = undefined;
      setPlayer(null);
      setState({
        deviceId: null,
        ready: false,
        error: null,
      });
      return;
    }

    if (
      playerRef.current &&
      activeUserIdRef.current === userId
    ) {
      return;
    }

    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
    }

    let cancelled = false;

    const initializePlayer = () => {
      if (cancelled || !window.Spotify) {
        return;
      }

      const spotifyPlayer = new window.Spotify.Player({
        name: "Musiguessr Web Player",
        getOAuthToken: async (callback) => {
          try {
            const response = await fetch(
              `http://127.0.0.1:3000/api/spotify/access-token?userId=${userId}`
            );

            const result = await response.json();

            if (!response.ok) {
              throw new Error(
                result?.error?.message ??
                  "Could not get Spotify token."
              );
            }

            callback(result.data.accessToken);
          } catch (error) {
            console.error(
              "Spotify token error:",
              error
            );

            setState((previous) => ({
              ...previous,
              error:
                error instanceof Error
                  ? error.message
                  : "Spotify authentication failed.",
            }));
          }
        },
        volume: 0.5,
      });

      spotifyPlayer.addListener("ready", ({ device_id }) => {
        setState({
          deviceId: device_id,
          ready: true,
          error: null,
        });
      });

      spotifyPlayer.addListener("not_ready", () => {
        setState((previous) => ({
          ...previous,
          ready: false,
        }));
      });

      spotifyPlayer.addListener("initialization_error", ({ message }) => {
        setState((previous) => ({
          ...previous,
          error: `Initialization error: ${message}`,
        }));
      });

      spotifyPlayer.addListener("authentication_error", ({ message }) => {
        setState((previous) => ({
          ...previous,
          error: `Authentication error: ${message}`,
        }));
      });

      spotifyPlayer.addListener("account_error", ({ message }) => {
        setState((previous) => ({
          ...previous,
          error: `Account error: ${message}`,
        }));
      });

      spotifyPlayer.addListener("playback_error", ({ message }) => {
        setState((previous) => ({
          ...previous,
          error: `Playback error: ${message}`,
        }));
      });

      spotifyPlayer.connect().then((success) => {
        if (!success) {
          setState((previous) => ({
            ...previous,
            error: "Spotify player connection failed.",
          }));
        }
      });

      playerRef.current = spotifyPlayer;
      activeUserIdRef.current = userId;
      setPlayer(spotifyPlayer);
    };

    window.onSpotifyWebPlaybackSDKReady = initializePlayer;

    if (window.Spotify) {
      initializePlayer();
    } else {
      const existingScript =
        document.querySelector(
          'script[src="https://sdk.scdn.co/spotify-player.js"]'
        );

      if (!existingScript) {
        const script =
          document.createElement("script");

        script.src =
          "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, []);

  return createElement(
    SpotifyContext.Provider,
    {
      value: {
        player,
        deviceId: state.deviceId,
        ready: state.ready,
        error: state.error,
      },
    },
    children
  );
};

export const useSpotifyPlayer = (
  userIdOverride?: number
) => {
  const context = useContext(SpotifyContext);

  if (userIdOverride === undefined) {
    return context;
  }

  const hasConnectedUser =
    context.ready ||
    context.deviceId ||
    context.error ||
    context.player;

  if (hasConnectedUser) {
    return context;
  }

  return {
    player: null,
    deviceId: null,
    ready: false,
    error: null,
  };
};