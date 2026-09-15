import "../styles/home.css";
import mainLogo from "../../mg-main2.png";

function Home() {
  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-welcome" aria-label="Welcome to Musiguessr">
          <span>Welcome to</span>
          <img src={mainLogo} alt="Musiguessr" />
        </div>

        <div className="home-badge">
          Powered by Spotify
        </div>

        <h1 className="home-title">
          Guess the song.
          <span> Beat the clock.</span>
        </h1>

        <p className="home-description">
          Musiguessr turns the music you already listen to
          into a fast-paced guessing game.
        </p>

        <p className="home-subtext">
          Your music. Your taste. Your score.
        </p>
      </section>

      <section className="home-features">
        <div className="feature-card">
          <span className="feature-number">01</span>
          <h2>Your Music</h2>
          <p>
            Play using songs based on your own Spotify
            listening history.
          </p>
        </div>

        <div className="feature-card">
          <span className="feature-number">02</span>
          <h2>Beat the Clock</h2>
          <p>
            The faster you recognize a song, the more points
            you earn.
          </p>
        </div>

        <div className="feature-card">
          <span className="feature-number">03</span>
          <h2>Track Your Score</h2>
          <p>
            Build your stats and see how well you really know
            your music.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Home;