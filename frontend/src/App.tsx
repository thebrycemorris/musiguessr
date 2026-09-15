import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import { SpotifyProvider } from "./hooks/useSpotifyPlayer";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import Leaderboard from "./pages/Leaderboard";
import Daily from "./pages/Daily";
import Discover from "./pages/Discover";
import People from "./pages/People";
import PublicProfile from "./pages/PublicProfile";

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("musiguessr_theme") === "light"
      ? "light"
      : "dark"
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("musiguessr_theme", theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <SpotifyProvider>
        <div className="app-shell">
          <Navbar />

          <div className="page-frame">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route path="/game" element={<Game />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/people" element={<People />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/discover" element={<Discover />} />
            <Route
              path="/settings"
              element={
                <Settings
                  theme={theme}
                  onThemeChange={setTheme}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
        </div>
      </SpotifyProvider>
    </BrowserRouter>
  );
}

export default App;