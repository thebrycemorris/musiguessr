import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/profile.css";

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

function Profile() {
  const navigate = useNavigate();

  const savedUser = useMemo<User | null>(() => {
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

  const [user, setUser] = useState<User | null>(savedUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: savedUser?.display_name ?? "",
    avatar_url: savedUser?.avatar_url ?? "",
    spotify_profile_url: savedUser?.spotify_profile_url ?? "",
    bio: savedUser?.bio ?? "",
    favorite_genre: savedUser?.favorite_genre ?? "",
  });

  const games = useMemo<GameResult[]>(() => {
    const storedHistory =
      localStorage.getItem("musiguessr_game_history");

    if (!storedHistory) {
      return [];
    }

    try {
      return JSON.parse(storedHistory) as GameResult[];
    } catch {
      return [];
    }
  }, []);

  const totalGames = games.length;

  const bestScore =
    totalGames > 0
      ? Math.max(...games.map((game) => game.score))
      : 0;

  const totalCorrect = games.reduce(
    (total, game) => total + game.correctAnswers,
    0
  );

  const totalQuestions = games.reduce(
    (total, game) => total + game.totalRounds,
    0
  );

  const overallAccuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Spotify user";

  const handleSaveProfile = async () => {
    if (!user) return;

    const response = await fetch(
      "http://127.0.0.1:3000/api/auth/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          display_name: formData.display_name || "Spotify User",
          avatar_url: formData.avatar_url || user.avatar_url || "",
          spotify_profile_url:
            formData.spotify_profile_url || user.spotify_profile_url || "",
          bio: formData.bio || "",
          favorite_genre: formData.favorite_genre || "",
        }),
      }
    );

    if (!response.ok) {
      return;
    }

    const result = (await response.json()) as {
      user: User;
    };
    const updatedUser = result.user;

    setUser(updatedUser);
    localStorage.setItem(
      "musiguessr_user",
      JSON.stringify(updatedUser)
    );
    setIsEditing(false);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div>
          <p className="profile-eyebrow">Profile</p>
        </div>

        <div className="profile-header-actions">
          {user ? (
            <>
              <button
                className="profile-secondary-button"
                onClick={() => {
                  if (isEditing) {
                    handleSaveProfile();
                  } else {
                    setFormData({
                      display_name: user.display_name ?? "",
                      avatar_url: user.avatar_url ?? "",
                      spotify_profile_url: user.spotify_profile_url ?? "",
                      bio: user.bio ?? "",
                      favorite_genre: user.favorite_genre ?? "",
                    });
                    setIsEditing(true);
                  }
                }}
              >
                {isEditing ? "Save Profile" : "Edit Profile"}
              </button>

              <button
                className="profile-play-button"
                onClick={() => navigate("/game")}
              >
                Play Again
              </button>
            </>
          ) : (
            <button
              className="profile-play-button"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          )}
        </div>
      </section>

      <section className="profile-hero">
        <div className="profile-card-main">
          <div className="profile-avatar-wrap">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Spotify profile"
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-fallback">
                {user?.display_name?.charAt(0)?.toUpperCase() ?? "S"}
              </div>
            )}
          </div>

          <div className="profile-meta">

            {isEditing ? (
              <div className="profile-edit-fields">
                <input
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder="Username"
                  className="profile-input"
                />
                <input
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  placeholder="Profile image URL"
                  className="profile-input"
                />
                <input
                  name="spotify_profile_url"
                  value={formData.spotify_profile_url}
                  onChange={handleInputChange}
                  placeholder="Spotify profile link"
                  className="profile-input"
                />
                <input
                  name="favorite_genre"
                  value={formData.favorite_genre}
                  onChange={handleInputChange}
                  placeholder="Favorite genre"
                  className="profile-input"
                />
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Write a short bio"
                  className="profile-textarea"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <h2>{user?.display_name ?? "Spotify User"}</h2>
                <p>
                  {user?.bio || "Music lover, always chasing the next favorite track."}
                </p>

                {user?.spotify_profile_url ? (
                  <a
                    href={user.spotify_profile_url}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-spotify-link"
                  >
                    View Spotify profile
                  </a>
                ) : (
                  <span className="profile-spotify-link muted-link">
                    Spotify linked for music data only
                  </span>
                )}

                <div className="profile-pill-row">
                  <span className="profile-pill">
                    Favorite genre: {user?.favorite_genre || "all of it"}
                  </span>
                  <span className="profile-pill">Joined {joinedDate}</span>
                  <span className="profile-pill">
                    {totalGames} {totalGames === 1 ? "game" : "games"} played
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="profile-stats-grid">
        <div className="profile-stat-card">
          <p>Games Played</p>
          <h3>{totalGames}</h3>
          <span>Completed music rounds</span>
        </div>

        <div className="profile-stat-card">
          <p>Best Score</p>
          <h3>{bestScore.toLocaleString()}</h3>
          <span>Personal best</span>
        </div>

        <div className="profile-stat-card">
          <p>Accuracy</p>
          <h3>{overallAccuracy}%</h3>
          <span>Across all rounds</span>
        </div>
      </section>

    </main>
  );
}

export default Profile;
