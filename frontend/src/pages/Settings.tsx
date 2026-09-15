import "../styles/settings.css";
import { useState } from "react";

type SettingsProps = {
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
};

function Settings({ theme, onThemeChange }: SettingsProps) {
  const [rounds, setRounds] = useState(() =>
    localStorage.getItem("musiguessr_rounds") ?? "10"
  );
  const [isRoundsOpen, setIsRoundsOpen] = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);

  const handleRoundsChange = (value: string) => {
    setRounds(value);
    localStorage.setItem("musiguessr_rounds", value);
  };

  const handleClearHistory = () => {
    localStorage.removeItem("musiguessr_game_history");
    setHistoryCleared(true);
  };

  return (
    <main className="settings-page centered-settings-page">
      <section className="settings-header">
        <p className="settings-eyebrow">Preferences</p>
        <h1>Settings</h1>
        <p>Adjust how Musiguessr looks while you play.</p>
      </section>

      <section className="settings-list" aria-label="Display settings">
        <div className="settings-row">
          <div>
            <h2>Appearance</h2>
            <p>Choose between a dark or light interface.</p>
          </div>

          <div className="theme-control" role="group" aria-label="Theme">
            <button
              type="button"
              className={theme === "dark" ? "is-selected" : ""}
              onClick={() => onThemeChange("dark")}
              aria-pressed={theme === "dark"}
            >
              Dark
            </button>
            <button
              type="button"
              className={theme === "light" ? "is-selected" : ""}
              onClick={() => onThemeChange("light")}
              aria-pressed={theme === "light"}
            >
              Light
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <h2>Rounds per game</h2>
            <p>Choose how long each game should be.</p>
          </div>

          <div className="settings-dropdown">
            <button
              type="button"
              className="settings-dropdown-trigger"
              onClick={() => setIsRoundsOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={isRoundsOpen}
            >
              {rounds} rounds
            </button>

            {isRoundsOpen && (
              <div className="settings-dropdown-menu" role="listbox">
                {["5", "10", "15"].map((option) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={rounds === option}
                    className={`settings-dropdown-option${rounds === option ? " is-selected" : ""}`}
                    key={option}
                    onClick={() => {
                      handleRoundsChange(option);
                      setIsRoundsOpen(false);
                    }}
                  >
                    {option} rounds
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <h2>Game history</h2>
            <p>Remove your saved scores from this browser.</p>
          </div>

          <button
            type="button"
            className="settings-danger-button"
            onClick={handleClearHistory}
            disabled={historyCleared}
          >
            {historyCleared ? "History cleared" : "Clear history"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default Settings;