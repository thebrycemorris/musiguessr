import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

type User = {
  id: number;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  spotify_profile_url?: string | null;
  created_at: string;
  bio?: string;
  favorite_genre?: string;
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

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user?.display_name ?? "",
    avatar_url: user?.avatar_url ?? "",
    spotify_profile_url: user?.spotify_profile_url ?? "",
    bio: user?.bio ?? "",
    favorite_genre: user?.favorite_genre ?? "",
  });

  const handleSaveProfile = async () => {
    if (!user) return;

    const response = await fetch("http://127.0.0.1:3000/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...formData }),
    });

    if (!response.ok) return;

    const result = (await response.json()) as { user: User };
    localStorage.setItem("musiguessr_user", JSON.stringify(result.user));
    setIsEditing(false);
    window.location.reload();
  };

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

        <div className="dashboard-connect-row">
          <button className="dashboard-start-button" onClick={handleStartGame}>
            Start Game
          </button>

          <div className="profile-card">
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
        </div>
      </section>

      <section className="play-card">
        {isEditing ? (
          <div className="dashboard-edit-fields">
            <input name="display_name" value={formData.display_name} onChange={(event) => setFormData({ ...formData, display_name: event.target.value })} placeholder="Username" />
            <input name="avatar_url" value={formData.avatar_url} onChange={(event) => setFormData({ ...formData, avatar_url: event.target.value })} placeholder="Profile image URL" />
            <input name="spotify_profile_url" value={formData.spotify_profile_url} onChange={(event) => setFormData({ ...formData, spotify_profile_url: event.target.value })} placeholder="Spotify profile link" />
            <input name="favorite_genre" value={formData.favorite_genre} onChange={(event) => setFormData({ ...formData, favorite_genre: event.target.value })} placeholder="Favorite genre" />
            <textarea name="bio" value={formData.bio} onChange={(event) => setFormData({ ...formData, bio: event.target.value })} placeholder="Write a short bio" rows={3} />
            <button className="dashboard-save-button" onClick={handleSaveProfile}>Save Profile</button>
          </div>
        ) : (
          <div className="dashboard-profile-main">
            {user?.avatar_url ? <img src={user.avatar_url} alt="Spotify profile" className="dashboard-profile-avatar" /> : <div className="dashboard-profile-avatar dashboard-profile-fallback">{user?.display_name?.charAt(0)?.toUpperCase() ?? "S"}</div>}
            <div>
              <h2>{user?.display_name ?? "Spotify User"}</h2>
              <p>{user?.bio || "Music lover, always chasing the next favorite track."}</p>
              {user?.spotify_profile_url ? <a href={user.spotify_profile_url} target="_blank" rel="noreferrer">View Spotify profile</a> : <span>Spotify linked for music data only</span>}
              <div className="dashboard-profile-pills">
                <span>Favorite genre: {user?.favorite_genre || "all of it"}</span>
                <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "today"}</span>
                <span>{totalGames} games played</span>
              </div>
              <button className="dashboard-edit-button" onClick={() => setIsEditing(true)}>Edit Profile</button>
            </div>
          </div>
        )}
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