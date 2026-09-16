import { useEffect, useMemo, useState } from "react";

import { API_URL } from "../config/api";
import "../styles/feature-pages.css";

type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
};

type TriviaQuestion = {
  prompt: string;
  answer: string;
  choices: string[];
  trackName: string;
  category: "artist" | "album";
};

type DailyResult = {
  challengeNumber: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
};

const QUESTION_COUNT = 5;
const DAILY_RESULT_KEY = "musiguessr_daily_result";

const shuffle = <T,>(items: T[], seed: number) => {
  const result = [...items];
  let value = seed;

  for (let index = result.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const swapIndex = Math.floor((value / 233280) * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

function Daily() {
  const today = new Date();
  const user = useMemo(() => {
    const storedUser = localStorage.getItem("musiguessr_user");

    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as { id: number };
    } catch {
      return null;
    }
  }, []);

  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const challengeNumber = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000
  );

  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(() => {
    const storedResult = localStorage.getItem(DAILY_RESULT_KEY);

    if (!storedResult) return null;

    try {
      const parsedResult = JSON.parse(storedResult) as DailyResult;
      return parsedResult.challengeNumber === challengeNumber ? parsedResult : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeUntilNextChallenge, setTimeUntilNextChallenge] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextDay = new Date(now);
      nextDay.setHours(24, 0, 0, 0);
      setTimeUntilNextChallenge(Math.max(0, nextDay.getTime() - now.getTime()));
    };

    updateCountdown();
    const countdownTimer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(countdownTimer);
  }, []);

  useEffect(() => {
    if (dailyResult) {
      setLoading(false);
      return;
    }

    if (!user) {
      setError("Connect Spotify to play today's challenge.");
      setLoading(false);
      return;
    }

    const loadQuestions = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/spotify/top-tracks?userId=${user.id}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error?.message ?? "Could not load daily trivia.");
        }

        const tracks = (result.data.tracks as Track[]).filter(
          (track) => track?.name && track.artist && track.album
        );
        const seed = challengeNumber;
        const selectedTracks = shuffle(tracks, seed).slice(0, QUESTION_COUNT);
        const questionList = selectedTracks.flatMap((track, index) => {
          const category: TriviaQuestion["category"] = index % 2 === 0 ? "artist" : "album";
          const answer = category === "artist" ? track.artist : track.album;
          const distractors = shuffle(
            tracks
              .filter((candidate) => candidate.id !== track.id)
              .map((candidate) => category === "artist" ? candidate.artist : candidate.album)
              .filter((choice, choiceIndex, allChoices) => allChoices.indexOf(choice) === choiceIndex && choice !== answer),
            seed + index
          ).slice(0, 3);
          const answerIndex = (challengeNumber + index) % 4;
          const choices = shuffle(distractors, seed + index + 1);
          choices.splice(answerIndex, 0, answer);

          return distractors.length === 3
            ? [{
                category,
                answer,
                choices,
                trackName: track.name,
                prompt: category === "artist"
                  ? `Who performs “${track.name}”?`
                  : `Which album is “${track.name}” from?`,
              }]
            : [];
        });

        if (questionList.length === 0) {
          throw new Error("Not enough Spotify track data to build today's trivia.");
        }

        setQuestions(questionList);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load daily trivia.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [challengeNumber, dailyResult, user]);

  const currentQuestion = questions[questionIndex];
  const finished = questions.length > 0 && questionIndex >= questions.length;
  const countdownHours = Math.floor(timeUntilNextChallenge / 3_600_000);
  const countdownMinutes = Math.floor((timeUntilNextChallenge % 3_600_000) / 60_000);
  const countdownSeconds = Math.floor((timeUntilNextChallenge % 60_000) / 1_000);
  const countdownLabel = [countdownHours, countdownMinutes, countdownSeconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");

  const handleChoice = (choice: string) => {
    if (selectedChoice || !currentQuestion) return;

    setSelectedChoice(choice);
    if (choice === currentQuestion.answer) {
      setScore((previousScore) => previousScore + 1000);
    }
  };

  const handleNext = () => {
    if (questionIndex + 1 === questions.length) {
      const result: DailyResult = {
        challengeNumber,
        score,
        correctAnswers: score / 1000,
        totalQuestions: questions.length,
      };

      localStorage.setItem(DAILY_RESULT_KEY, JSON.stringify(result));
      setDailyResult(result);
    }

    setSelectedChoice(null);
    setQuestionIndex((previousIndex) => previousIndex + 1);
  };

  return (
    <main className="feature-page daily-page">
      <section className="feature-page-header">
        <p className="feature-eyebrow">Every day</p>
        <h1>Daily challenge</h1>
        <p>{dateLabel} · Challenge #{challengeNumber}</p>
        <p className="daily-countdown">
          Next challenge in <strong>{countdownLabel}</strong>
        </p>
      </section>

      <section className="feature-panel daily-panel daily-quiz-panel">
        {loading && <p>Building today&apos;s questions...</p>}

        {!loading && error && <p className="daily-error">{error}</p>}

        {!loading && !error && (finished || dailyResult) && (
          <>
            <span className="daily-mark">Complete</span>
            <h2>Today&apos;s score: {(dailyResult?.score ?? score).toLocaleString()}</h2>
            <p>
              You got {dailyResult?.correctAnswers ?? score / 1000} of {dailyResult?.totalQuestions ?? questions.length} questions right.
            </p>
          </>
        )}

        {!loading && !error && !dailyResult && currentQuestion && (
          <>
            <div className="daily-question-meta">
              <span className="daily-mark">Question {questionIndex + 1} of {questions.length}</span>
              <strong>{score.toLocaleString()} pts</strong>
            </div>
            <p className="daily-trivia-category">
              {currentQuestion.category === "artist" ? "Artist trivia" : "Album trivia"}
            </p>
            <h2>{currentQuestion.prompt}</h2>
            <div className="daily-choice-grid">
              {currentQuestion.choices.map((choice) => {
                const isCorrect = choice === currentQuestion.answer;
                const isSelected = choice === selectedChoice;
                const className = selectedChoice
                  ? isCorrect
                    ? "daily-choice correct"
                    : isSelected
                      ? "daily-choice incorrect"
                      : "daily-choice muted"
                  : "daily-choice";

                return (
                  <button
                    key={choice}
                    type="button"
                    className={className}
                    onClick={() => handleChoice(choice)}
                    disabled={Boolean(selectedChoice)}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            {selectedChoice && (
              <>
                <p className={selectedChoice === currentQuestion.answer ? "daily-feedback correct-text" : "daily-feedback"}>
                  {selectedChoice === currentQuestion.answer ? "Correct!" : `The answer is ${currentQuestion.answer}.`}
                </p>
                <button type="button" onClick={handleNext}>
                  {questionIndex + 1 === questions.length ? "See results" : "Next question"}
                </button>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default Daily;