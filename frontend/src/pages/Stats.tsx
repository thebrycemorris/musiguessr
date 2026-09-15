import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/stats.css";

type GameResult = {
  id: string;
  score: number;
  correctAnswers: number;
  totalRounds: number;
  accuracy: number;
  completedAt: string;
};

function Stats() {
  const navigate = useNavigate();

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
    games.length > 0
      ? Math.max(
          ...games.map(
            (game) => game.score
          )
        )
      : 0;

  const totalCorrect =
    games.reduce(
      (total, game) =>
        total +
        game.correctAnswers,
      0
    );

  const totalQuestions =
    games.reduce(
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

  const averageScore =
    totalGames > 0
      ? Math.round(
          games.reduce(
            (total, game) =>
              total + game.score,
            0
          ) / totalGames
        )
      : 0;

  return (
    <main className="stats-page">
      <section className="stats-header">
        <div>
          <p className="stats-eyebrow">
            Your performance
          </p>

          <h1>
            Musiguessr
            <span> Stats</span>
          </h1>

          <p className="stats-description">
            See how well you know the
            music you actually listen to.
          </p>
        </div>

        <button
          className="stats-play-button"
          onClick={() =>
            navigate("/game")
          }
        >
          Play Again
        </button>
      </section>

      <section className="stats-overview">
        <div className="stats-card">
          <p>Games Played</p>

          <h2>
            {totalGames}
          </h2>

          <span>
            Completed games
          </span>
        </div>

        <div className="stats-card">
          <p>Best Score</p>

          <h2>
            {bestScore.toLocaleString()}
          </h2>

          <span>
            Personal best
          </span>
        </div>

        <div className="stats-card">
          <p>Accuracy</p>

          <h2>
            {overallAccuracy}%
          </h2>

          <span>
            All-time accuracy
          </span>
        </div>

        <div className="stats-card">
          <p>Average Score</p>

          <h2>
            {averageScore.toLocaleString()}
          </h2>

          <span>
            Per game
          </span>
        </div>
      </section>

      <section className="stats-history">
        <div className="stats-history-heading">
          <div>
            <p className="stats-eyebrow">
              Game history
            </p>

            <h2>
              Recent Games
            </h2>
          </div>

          <span>
            {totalGames}{" "}
            {totalGames === 1
              ? "game"
              : "games"}
          </span>
        </div>

        {games.length === 0 ? (
          <div className="stats-empty">
            <div className="stats-empty-icon">
              ♪
            </div>

            <h3>
              No games yet
            </h3>

            <p>
              Finish your first
              Musiguessr game and your
              stats will appear here.
            </p>

            <button
              className="stats-play-button"
              onClick={() =>
                navigate("/game")
              }
            >
              Start Game
            </button>
          </div>
        ) : (
          <div className="game-history-list">
            {games.map(
              (game, index) => (
                <div
                  className="history-row"
                  key={game.id}
                >
                  <div className="history-game-number">
                    <span>
                      Game
                    </span>

                    <strong>
                      {games.length -
                        index}
                    </strong>
                  </div>

                  <div className="history-stat">
                    <span>
                      Score
                    </span>

                    <strong>
                      {game.score.toLocaleString()}
                    </strong>
                  </div>

                  <div className="history-stat">
                    <span>
                      Correct
                    </span>

                    <strong>
                      {
                        game.correctAnswers
                      }
                      /
                      {
                        game.totalRounds
                      }
                    </strong>
                  </div>

                  <div className="history-stat">
                    <span>
                      Accuracy
                    </span>

                    <strong>
                      {
                        game.accuracy
                      }
                      %
                    </strong>
                  </div>

                  <div className="history-date">
                    {new Date(
                      game.completedAt
                    ).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default Stats;