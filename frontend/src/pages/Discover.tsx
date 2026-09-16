import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { API_URL } from "../config/api";
import "../styles/feature-pages.css";

type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  uri: string;
};

function Discover() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [message, setMessage] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const storedUser = localStorage.getItem("musiguessr_user");
  const user = useMemo(() => {
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as { id: number };
    } catch {
      return null;
    }
  }, [storedUser]);
  const [loading, setLoading] = useState(Boolean(user));
  const { deviceId, ready: playerReady, error: playerError } = useSpotifyPlayer(user?.id);

  const shuffleTracks = (items: Track[]) =>
    [...items].sort(() => Math.random() - 0.5).slice(0, 12);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    fetch(`${API_URL}/api/spotify/discover?userId=${user.id}`)
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;
        if (!result.success) throw new Error(result.error?.message);
        setTracks(shuffleTracks(result.data?.tracks ?? []));
        setMessage("");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setTracks([]);
          setMessage(error instanceof Error ? error.message : "Could not load releases.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleRefresh = async () => {
    if (!user) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/spotify/discover?userId=${user.id}&refresh=${Date.now()}`
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Refresh failed.");
      }
      setTracks(shuffleTracks(result.data?.tracks ?? []));
    } catch (error: unknown) {
      setTracks([]);
      setMessage(error instanceof Error ? error.message : "Refresh failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (track: Track) => {
    if (!user || !deviceId || !playerReady) return;

    setPlayingId(track.id);
    try {
      const response = await fetch(`${API_URL}/api/spotify/play`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, deviceId, trackUri: track.uri }),
      });
      if (!response.ok) throw new Error("Spotify could not play this track.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Playback failed.");
    } finally {
      setPlayingId(null);
    }
  };

  return (
    <main className="feature-page discover-page">
      <section className="feature-page-header">
        <p className="feature-eyebrow">Fresh from your orbit</p>
        <h1>Discover</h1>
        <p>New releases from artists you follow, plus anything you want to find.</p>
      </section>

      {!user ? (
        <section className="feature-panel feature-empty-state">
          <h2>Connect Spotify to discover music</h2>
          <p>Sign in to see new releases related to your listening.</p>
          <button onClick={() => navigate("/login")}>Log in with Spotify</button>
        </section>
      ) : (
        <>
          <div className="discover-heading-row">
            <h2>New releases for you</h2>
            {playerError && <span>{playerError}</span>}
          </div>

          <button
            className="discover-refresh-button"
            type="button"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh songs"}
          </button>

          {loading ? (
            <section className="feature-panel feature-empty-state"><p>Loading music...</p></section>
          ) : message ? (
            <section className="feature-panel feature-empty-state"><p>{message}</p></section>
          ) : (
            <section className="discover-grid">
              {tracks.map((track) => (
                <article className="discover-card" key={track.id}>
                  {track.image ? <img src={track.image} alt="" /> : <div className="discover-art" />}
                  <div className="discover-card-info">
                    <h2>{track.name}</h2>
                    <p>{track.artist}</p>
                    <span>{track.album}</span>
                  </div>
                  <button
                    className="discover-play-button"
                    type="button"
                    onClick={() => handlePlay(track)}
                    disabled={!playerReady || !deviceId || playingId === track.id}
                    title={playerReady ? "Play track" : "Connect Spotify playback first"}
                  >
                    {playingId === track.id ? "..." : "Play"}
                  </button>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default Discover;