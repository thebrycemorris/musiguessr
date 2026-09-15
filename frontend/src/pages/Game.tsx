import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import "../styles/game.css";

type User = {
  id: number;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string | null;
  uri: string;
};

type GameHistoryItem = {
  id: string;
  score: number;
  correctAnswers: number;
  totalRounds: number;
  accuracy: number;
  completedAt: string;
};

const ROUND_TIME_LIMIT = 12;
const MAX_ROUND_POINTS = 1000;

type GameMode = "liked" | "discovery";

function Game() {
  const navigate = useNavigate();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [allTrackChoices, setAllTrackChoices] =
    useState<Track[]>([]);
  const [usedTrackIds, setUsedTrackIds] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  const [guess, setGuess] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("liked");
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_TIME_LIMIT);
  const [pointsEarned, setPointsEarned] = useState(0);
  const totalRounds = Number(
    localStorage.getItem("musiguessr_rounds") ?? 10
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  const [gameStarted, setGameStarted] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  const user = useMemo<User | null>(() => {
    const storedUser =
      localStorage.getItem("musiguessr_user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  }, []);

  const {
    player,
    deviceId,
    ready: playerReady,
    error: playerError,
  } = useSpotifyPlayer(user?.id);

  const currentTrack = tracks[currentRound];

  const answerOptions = useMemo(() => {
    const trimmedGuess = guess.trim().toLowerCase();

    if (!trimmedGuess) return [];

    return [
      ...new Map(
        allTrackChoices
          .filter((track) =>
            `${track.name} ${track.artist}`
              .toLowerCase()
              .includes(trimmedGuess)
          )
          .map((track) => [track.name.toLowerCase(), track])
      ).values(),
    ]
      .slice(0, 15);
  }, [allTrackChoices, guess]);

  /*
   * Load Spotify tracks
   */
  useEffect(() => {
    if (!user) {
      setError(
        "You need to connect your Spotify account first."
      );

      setLoading(false);
      return;
    }

    const loadTracks = async () => {
      try {
        const endpoint =
          gameMode === "discovery"
            ? `http://127.0.0.1:3000/api/spotify/discover?userId=${user.id}`
            : `http://127.0.0.1:3000/api/spotify/top-tracks?userId=${user.id}`;

        const response = await fetch(endpoint);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error?.message ??
              "Could not load Spotify tracks."
          );
        }

        const fullTrackPool = [
          ...result.data.tracks,
        ]
          .filter(
            (track: Track) =>
              track &&
              track.name &&
              track.uri
          )
          .sort(() => Math.random() - 0.5);

        const uniqueTracks = [
          ...new Map(
            fullTrackPool.map((track) => [
              track.name,
              track,
            ])
          ).values(),
        ];

        const selectedTracks = [...uniqueTracks]
          .sort(() => Math.random() - 0.5)
          .slice(0, totalRounds);

        setAllTrackChoices(uniqueTracks);
        setUsedTrackIds(selectedTracks.map((track) => track.id));
        setTracks(selectedTracks);
      } catch (err) {
        console.error(
          "Track loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Could not load Spotify tracks."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, [user, gameMode, totalRounds]);

  /*
   * Start Spotify playback
   */
  const playCurrentTrack = async () => {
    if (
      !user ||
      !deviceId ||
      !currentTrack
    ) {
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:3000/api/spotify/play",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: user.id,
            deviceId,
            trackUri: currentTrack.uri,
          }),
        }
      );

      if (!response.ok) {
        let message =
          "Could not start Spotify playback.";

        try {
          const result =
            await response.json();

          message =
            result?.error?.message ??
            message;
        } catch {
          // Backend may return no JSON body
        }

        throw new Error(message);
      }
    } catch (err) {
      console.error(
        "Playback error:",
        err
      );

      throw err;
    }
  };

  /*
   * Start game only after user clicks Start Game
   */
  const handleStartGame = async () => {
    if (
      !playerReady ||
      !deviceId ||
      !currentTrack
    ) {
      return;
    }

    setStartingGame(true);

    try {
      await playCurrentTrack();
      setTimeRemaining(ROUND_TIME_LIMIT);
      setGameStarted(true);
    } catch {
      setError(
        "Spotify could not start playback."
      );
    } finally {
      setStartingGame(false);
    }
  };

  /*
   * Automatically play each new round
   */
  useEffect(() => {
    if (
      !gameStarted ||
      !playerReady ||
      !deviceId ||
      !currentTrack ||
      answered
    ) {
      return;
    }

    playCurrentTrack().catch((err) => {
      console.error(
        "Automatic playback error:",
        err
      );
    });
  }, [
    gameStarted,
    playerReady,
    deviceId,
    currentRound,
  ]);

  /*
   * Normalize answers
   */
  const normalizeAnswer = (
    value: string
  ) => {
    return value
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  /*
   * Submit answer
   */
  const handleSubmit = async () => {
    if (
      !currentTrack ||
      answered ||
      !guess.trim()
    ) {
      return;
    }

    try {
      await player?.pause();
    } catch (err) {
      console.error(
        "Could not pause Spotify player:",
        err
      );
    }

    const submittedGuess =
      normalizeAnswer(guess);

    const correctAnswer =
      normalizeAnswer(currentTrack.name);

    const correct =
      submittedGuess === correctAnswer;

    setWasCorrect(correct);
    setAnswered(true);

    if (correct) {
      const earnedPoints = Math.round(
        (timeRemaining / ROUND_TIME_LIMIT) *
          MAX_ROUND_POINTS
      );

      setPointsEarned(earnedPoints);
      setScore(
        (previousScore) =>
          previousScore + earnedPoints
      );

      setCorrectAnswers(
        (previousCorrect) =>
          previousCorrect + 1
      );
    }
  };

  /*
   * Skip current round
   */
  const handleSkip = async () => {
    if (!currentTrack || answered) {
      return;
    }

    try {
      await player?.pause();
    } catch (err) {
      console.error(
        "Could not pause Spotify player:",
        err
      );
    }

    setWasCorrect(false);
    setPointsEarned(0);
    setAnswered(true);
  };

  useEffect(() => {
    if (!gameStarted || answered) {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(
        0,
        ROUND_TIME_LIMIT - elapsed
      );

      setTimeRemaining(remaining);

      if (remaining === 0) {
        window.clearInterval(timer);
        player?.pause().catch((err) => {
          console.error("Could not pause expired round:", err);
        });
        setWasCorrect(false);
        setPointsEarned(0);
        setAnswered(true);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [gameStarted, answered, currentRound, player]);

  /*
   * Save completed game locally
   */
  const saveCompletedGame = () => {
    const accuracy =
      tracks.length > 0
        ? Math.round(
            (correctAnswers /
              tracks.length) *
              100
          )
        : 0;

    const completedGame: GameHistoryItem = {
      id: crypto.randomUUID(),
      score,
      correctAnswers,
      totalRounds: tracks.length,
      accuracy,
      completedAt:
        new Date().toISOString(),
    };

    const storedHistory =
      localStorage.getItem(
        "musiguessr_game_history"
      );

    let gameHistory: GameHistoryItem[] = [];

    if (storedHistory) {
      try {
        gameHistory =
          JSON.parse(
            storedHistory
          ) as GameHistoryItem[];
      } catch {
        gameHistory = [];
      }
    }

    gameHistory.unshift(
      completedGame
    );

    localStorage.setItem(
      "musiguessr_game_history",
      JSON.stringify(gameHistory)
    );

    if (user) {
      fetch("http://127.0.0.1:3000/api/community/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          score,
          gameMode: gameMode === "discovery" ? "DISCOVERY" : "TOP_TRACKS",
          completedAt: completedGame.completedAt,
        }),
      }).catch((error) => {
        console.error("Could not publish game score:", error);
      });
    }
  };

  /*
   * Next round / finish game
   */
  const handleNextRound = async () => {
    if (
      currentRound + 1 >=
      tracks.length
    ) {
      try {
        await player?.pause();
      } catch (err) {
        console.error(
          "Could not pause Spotify player:",
          err
        );
      }

      saveCompletedGame();

      navigate("/stats");

      return;
    }

    const nextRoundIndex = currentRound + 1;

    if (gameMode === "discovery") {
      const availableTracks = allTrackChoices.filter(
        (track) =>
          !usedTrackIds.includes(track.id) &&
          track.id !== currentTrack?.id
      );

      const replacementTrack =
        availableTracks.length > 0
          ? availableTracks[
              Math.floor(
                Math.random() *
                  availableTracks.length
              )
            ]
          : currentTrack;

      if (replacementTrack) {
        setUsedTrackIds((previousUsed) => [
          ...previousUsed,
          replacementTrack.id,
        ]);

        setTracks((previousTracks) => {
          const nextTracks = [...previousTracks];
          nextTracks[nextRoundIndex] =
            replacementTrack;
          return nextTracks;
        });
      }
    }

    setCurrentRound(nextRoundIndex);

    setGuess("");
    setTimeRemaining(ROUND_TIME_LIMIT);
    setPointsEarned(0);
    setAnswered(false);
    setWasCorrect(false);
  };

  /*
   * Loading screen
   */
  if (loading) {
    return (
      <main className="game-page game-centered">
        <div className="game-loader" />

        <h1>
          Loading your music...
        </h1>

        <p>
          Building your Musiguessr game.
        </p>
      </main>
    );
  }

  /*
   * Error screen
   */
  if (error) {
    return (
      <main className="game-page game-centered">
        <p className="game-eyebrow">
          Something went wrong
        </p>

        <h1>
          Couldn't start the game.
        </h1>

        <p className="game-error-message">
          {error}
        </p>

        <button
          className="game-primary-button"
          onClick={() =>
            navigate("/")
          }
        >
          Return Home
        </button>
      </main>
    );
  }

  /*
   * No tracks
   */
  if (!currentTrack) {
    return (
      <main className="game-page game-centered">
        <h1>No tracks found.</h1>

        <p>
          We couldn't find enough Spotify
          tracks to start a game.
        </p>
      </main>
    );
  }

  /*
   * Pre-game screen
   */
  if (!gameStarted) {
    return (
      <div className="game-prestart-shell">
        <main className="game-page game-centered game-prestart">
        <div className="spotify-source-badge">
          Spotify Playback
        </div>

        <h1>
          Ready to play?
        </h1>

        <div className="game-mode-picker" role="tablist" aria-label="Game mode selector">
          <button
            type="button"
            className={gameMode === "liked" ? "game-mode-button active" : "game-mode-button"}
            onClick={() => {
              setGuess("");
              setGameMode("liked");
            }}
          >
            Your Mix
          </button>
          <button
            type="button"
            className={gameMode === "discovery" ? "game-mode-button active" : "game-mode-button"}
            onClick={() => {
              setGuess("");
              setGameMode("discovery");
            }}
          >
            Discovery
          </button>
        </div>

        <p
          style={{
            marginTop: "12px",
            color: "#707070",
            maxWidth: "500px",
            lineHeight: "1.6",
          }}
        >
          {gameMode === "discovery"
            ? "This mode pulls from a wider Spotify recommendation pool so you can keep discovering new songs beyond your usual favorites."
            : "This mode uses your recent top tracks and favorites so the game feels personal and familiar."}
        </p>

        {playerError && (
          <p
            style={{
              marginTop: "18px",
              color: "#999",
              fontSize: "0.85rem",
            }}
          >
            Spotify player: {playerError}
          </p>
        )}

        <button
          className="game-primary-button"
          onClick={handleStartGame}
          disabled={
            !playerReady ||
            !deviceId ||
            startingGame
          }
          style={{
            marginTop: "28px",
          }}
        >
          {startingGame
            ? "Starting..."
            : playerReady
              ? "Start Game"
              : "Connecting to Spotify..."}
        </button>
        </main>
      </div>
    );
  }

  const progress =
    ((currentRound + 1) /
      tracks.length) *
    100;

  return (
    <main className="game-page">
      <section className="game-topbar">
        <div className="game-round-info">
          <span className="game-badge">
            Round {currentRound + 1}
          </span>

          <span className="game-round-total">
            of {tracks.length}
          </span>
        </div>

        <div className="game-score">
          <span>Score</span>

          <strong>
            {score.toLocaleString()}
          </strong>
        </div>

        <div className="game-timer">
          <span>Time</span>
          <strong>{timeRemaining.toFixed(1)}s</strong>
          <small>
            {Math.round(
              (timeRemaining / ROUND_TIME_LIMIT) *
                MAX_ROUND_POINTS
            )} pts available
          </small>
        </div>
      </section>

      <div className="game-progress">
        <div
          className="game-progress-fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <section className="game-content">
        <div className="game-track-section">
          <div className="spotify-source-badge">
            {gameMode === "discovery"
              ? "Spotify Discovery"
              : "Spotify Top Tracks"}
          </div>

          <div
            className={`game-album-container ${
              answered
                ? "revealed"
                : ""
            }`}
          >
            {currentTrack.image ? (
              <img
                src={
                  currentTrack.image
                }
                alt={
                  answered
                    ? currentTrack.album
                    : "Hidden album artwork"
                }
                className="game-album-image"
              />
            ) : (
              <div className="game-album-placeholder">
                ♪
              </div>
            )}

            {!answered && (
              <div className="game-album-cover">
                <div className="game-music-icon">
                  ♪
                </div>

                <span>
                  Album hidden
                </span>
              </div>
            )}
          </div>

          <div className="game-now-playing">
            <div className="playing-bars">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <span>
              {answered
                ? "Track revealed"
                : "Now playing"}
            </span>
          </div>

          {playerError && (
            <p
              style={{
                marginTop: "12px",
                color: "#888",
                fontSize: "0.8rem",
                textAlign: "center",
              }}
            >
              Spotify player:{" "}
              {playerError}
            </p>
          )}
        </div>

        <div className="game-answer-section">
          {!answered ? (
            <>
              <p className="game-eyebrow">
                Name that song
              </p>

              <h1>
                What track is this?
              </h1>

              <p className="game-description">
                Search and pick the song title.
                The faster you recognize it,
                the more points you'll earn.
              </p>

              <div className="game-input-wrapper">
                <input
                  type="text"
                  value={guess}
                  onChange={(event) => {
                    setGuess(event.target.value);
                    setShowSuggestions(event.target.value.trim().length > 0);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 120);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      handleSubmit();
                    }
                  }}
                  placeholder="Search for a song..."
                  autoFocus
                  aria-label="Search for the song title"
                />

                {showSuggestions && answerOptions.length > 0 && (
                  <div className="game-suggestions">
                    {answerOptions.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        className="game-suggestion-item"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setGuess(track.name);
                          setShowSuggestions(false);
                        }}
                      >
                        {track.name} <strong> - {track.artist}</strong>
                      </button>
                    ))}
                  </div>
                )}

              </div>

              <div className="game-actions">
                <button
                  className="game-primary-button"
                  onClick={
                    handleSubmit
                  }
                  disabled={
                    !guess.trim()
                  }
                >
                  Submit Guess
                </button>

                <button
                  className="game-secondary-button"
                  onClick={
                    handleSkip
                  }
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <div className="game-result">
              <p
                className={
                  wasCorrect
                    ? "game-result-correct"
                    : "game-result-wrong"
                }
              >
                {wasCorrect
                  ? "Correct!"
                  : "Not quite"}
              </p>

              <h1>
                {currentTrack.name}
              </h1>

              <h2>
                {currentTrack.artist}
              </h2>

              <p className="game-album-name">
                {currentTrack.album}
              </p>

              {wasCorrect && (
                <div className="points-earned">
                  +{pointsEarned.toLocaleString()} points
                </div>
              )}

              <button
                className="game-primary-button"
                onClick={
                  handleNextRound
                }
              >
                {currentRound + 1 >=
                tracks.length
                  ? "View Results"
                  : "Next Round"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Game;