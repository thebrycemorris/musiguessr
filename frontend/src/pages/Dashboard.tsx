import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

type User = {
  id: number;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

type GameResult = {
  id: string;
  score: number;
  correctAnswers: number;
  totalRounds: number;
  accuracy: number;
  completedAt: string;
};

function Dashboard() {
  const navigate = useNavigate();

  const user = useMemo<User | null>(() => {
    const params = new URLSearchParams(
      window.location.search
    );
    const userData = params.get("user");

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData) as User;
        localStorage.setItem(
          "musiguessr_user",
          JSON.stringify(parsedUser)
        );
        return parsedUser;
      } catch (error) {
        console.error(
          "Could not parse user data:",
          error
        );
      }
    }

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

  const games = useMemo<GameResult[]>(() => {
    const storedHistory =
      localStorage.getItem(
        "musiguessr_game_history"
      );

    if (!storedHistory) {
      return [];
    }

    try {
      return JSON.parse(
        storedHistory
      ) as GameResult[];
    } catch {
      return [];
    }
  }, []);

  const totalGames = games.length;

  const bestScore =
    totalGames > 0
      ? Math.max(
          ...games.map(
            (game) => game.score
          )
        )
      : 0;

  const totalCorrect = games.reduce(
    (total, game) =>
      total + game.correctAnswers,
    0
  );

  const totalQuestions = games.reduce(
    (total, game) =>
      total + game.totalRounds,
    0
  );

  const overallAccuracy =
    totalQuestions > 0
      ? Math.round(
          (totalCorrect /
            totalQuestions) *
            100
        )
      : 0;

  const handleStartGame = () => {
    navigate("/game");
  };

  return (
    <main className="dashboard">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Your dashboard</p>

          <h1>
            Welcome back,
            <span> {user?.display_name ?? "Spotify User"}</span>
          </h1>

          <p className="dashboard-subtitle">
            Ready to find out how well you actually know your music?
          </p>
        </div>

        <div
          className="profile-card"
          onClick={() => navigate("/profile")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              navigate("/profile");
            }
          }}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Spotify profile"
              className="profile-image"
            />
          ) : (
            <div className="profile-placeholder">
              M
            </div>
          )}

          <div>
            <h2>{user?.display_name ?? "Spotify User"}</h2>
            <p>Connected with Spotify</p>
          </div>
        </div>
      </section>

      <section className="play-card">
        <div className="play-card-content">
          <span className="play-label">Your Top Tracks</span>

          <h2>
            Think you know your music?
          </h2>

          <p>
            Musiguessr pulls songs from your Spotify listening
            history and put your memory to the test.
          </p>

          <button
            className="start-game-button"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>

        <div className="play-visual">
          <div className="record">
            <div className="record-center" />
          </div>
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="stat-card">
          <p>Games Played</p>
          <h3>{totalGames}</h3>
          <span>
            {totalGames === 0
              ? "Start your first game"
              : "Completed games"}
          </span>
        </div>

        <div className="stat-card">
          <p>Best Score</p>
          <h3>{bestScore.toLocaleString()}</h3>
          <span>
            {totalGames === 0
              ? "Your highest score"
              : "Personal best"}
          </span>
        </div>

        <div className="stat-card">
          <p>Accuracy</p>
          <h3>{overallAccuracy}%</h3>
          <span>
            {totalGames === 0
              ? "Correct guesses"
              : "All-time accuracy"}
          </span>
        </div>
      </section>

    </main>
  );
}

export default Dashboard;