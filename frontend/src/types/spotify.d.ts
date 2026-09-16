export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;

    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
  }

  interface SpotifyPlayer {
    connect(): Promise<boolean>;
    disconnect(): void;

    addListener(
      event: "ready",
      callback: (data: { device_id: string }) => void
    ): boolean;

    addListener(
      event: "not_ready",
      callback: (data: { device_id: string }) => void
    ): boolean;

    addListener(
      event:
        | "initialization_error"
        | "authentication_error"
        | "account_error"
        | "playback_error",
      callback: (data: { message: string }) => void
    ): boolean;

    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    getCurrentState(): Promise<SpotifyPlaybackState | null>;
  }

  interface SpotifyPlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: {
        id: string;
      };
    };
  }
}