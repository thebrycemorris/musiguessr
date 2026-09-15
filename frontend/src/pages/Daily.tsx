import { useNavigate } from "react-router-dom";

import "../styles/feature-pages.css";

function Daily() {
  const navigate = useNavigate();
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const challengeNumber = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000
  );

  return (
    <main className="feature-page daily-page">
      <section className="feature-page-header">
        <p className="feature-eyebrow">Every day</p>
        <h1>Daily challenge</h1>
        <p>{dateLabel} · Challenge #{challengeNumber}</p>
      </section>

      <section className="feature-panel daily-panel">
        <span className="daily-mark">01</span>
        <h2>Can you recognize the soundtrack of your day?</h2>
        <p>
          One focused run, one score to beat, and a fresh reason to come back
          tomorrow.
        </p>
        <button onClick={() => navigate("/game")}>Play today&apos;s challenge</button>
      </section>
    </main>
  );
}

export default Daily;