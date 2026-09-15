import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "../styles/feature-pages.css";

type LeaderboardEntry = {
  id: number;
  userId: number;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  completedAt: string;
};

function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:3000/api/community/leaderboard")
      .then((response) => response.json())
      .then((result) => setEntries(result.data?.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="feature-page leaderboard-page">
      <section className="feature-page-header">
        <p className="feature-eyebrow">Worldwide</p>
        <h1>Global leaderboard</h1>
        <p>See who is climbing the Musiguessr ranks.</p>
      </section>

      <section className="feature-panel leaderboard-panel">
        {loading ? (
          <div className="feature-empty-state"><p>Loading the rankings...</p></div>
        ) : entries.length > 0 ? (
          <div className="leaderboard-list">
            {entries.map((entry, index) => (
              <div className="leaderboard-row" key={`${entry.id}-${entry.userId}`}>
                <strong className="leaderboard-rank">#{index + 1}</strong>
                <Link className="leaderboard-user" to={`/profile/${entry.userId}`}>
                  {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : <span>{entry.displayName?.charAt(0) ?? "S"}</span>}
                  <strong>{entry.displayName ?? "Spotify User"}</strong>
                </Link>
                <strong>{entry.score.toLocaleString()} pts</strong>
                <span>{new Date(entry.completedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="feature-empty-state">
            <h2>No scores yet</h2>
            <p>Be the first player to claim the top spot.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Leaderboard;