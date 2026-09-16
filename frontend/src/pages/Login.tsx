import { Link } from "react-router-dom";

import { API_URL } from "../config/api";
import "../styles/login.css";

function Login() {
  const handleSpotifyLogin = () => {
    window.location.href =
      `${API_URL}/api/auth/spotify`;
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="login-eyebrow">Welcome back</p>
        <h1>Sign in to Musiguessr</h1>
        <p className="login-description">
          Connect your Spotify account to play with the music you already know.
        </p>

        <button
          type="button"
          className="spotify-button login-button"
          onClick={handleSpotifyLogin}
        >
          Continue with Spotify
        </button>

        <Link to="/" className="login-back-link">
          Back to home
        </Link>
      </section>
    </main>
  );
}

export default Login;