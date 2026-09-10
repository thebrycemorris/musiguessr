import { useEffect, useState } from "react";

type User = {
  id: number;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const login = params.get("login");
    const userData = params.get("user");

    if (login === "success" && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (error) {
        console.error("Could not parse user data:", error);
      }
    }
  }, []);

  const handleSpotifyLogin = () => {
    window.location.href =
      "http://127.0.0.1:3000/api/auth/spotify";
  };

  if (user) {
    return (
      <main>
        <h1>Musiguessr</h1>

        <h2>
          Welcome, {user.display_name ?? "Spotify User"}!
        </h2>

        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt="Spotify profile"
            width="120"
          />
        )}

        <p>You're connected to Spotify.</p>

        <button>Start Game</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Musiguessr</h1>

      <p>Guess the song as quick as you can!</p>

      <button onClick={handleSpotifyLogin}>
        Connect with Spotify
      </button>
    </main>
  );
}

export default App;