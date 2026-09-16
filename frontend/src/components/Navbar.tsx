import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import navbarLogo from "../../mg-nav.png";
import "../styles/navbar.css";

type StoredUser = {
  display_name?: string | null;
  avatar_url?: string | null;
};

function Navbar() {
  const [user, setUser] = useState<StoredUser | null>(() => {
    const callbackUser = new URLSearchParams(
      window.location.search
    ).get("user");

    if (callbackUser) {
      try {
        return JSON.parse(callbackUser) as StoredUser;
      } catch {
        return null;
      }
    }

    const storedUser = localStorage.getItem("musiguessr_user");

    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as StoredUser;
    } catch {
      return null;
    }
  });

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" aria-label="Musiguessr home">
        <img src={navbarLogo} alt="Musiguessr" />
      </Link>

      <div className="navbar-links">
        <Link to="/dashboard" className="navbar-dashboard-link">
          <span>Dashboard</span>
          {user && (user.avatar_url ? <img src={user.avatar_url} alt="" className="navbar-avatar" /> : <span className="navbar-avatar navbar-avatar-fallback">{user.display_name?.charAt(0)?.toUpperCase() ?? "S"}</span>)}
        </Link>
        <Link to="/game">Play</Link>
        <Link to="/daily">Daily</Link>
        <Link to="/discover">Discover</Link>
        <Link to="/stats">Stats</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/people">Friends</Link>
        <Link to="/settings">Settings</Link>
      </div>

      {user ? (
        <LogoutButton onLogout={() => setUser(null)} />
      ) : (
        <Link to="/login" className="navbar-login">
          Log in
        </Link>
      )}
    </nav>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("musiguessr_user");
    onLogout();
    navigate("/");
  };

  return (
    <button type="button" className="navbar-logout" onClick={handleLogout}>
      Log out
    </button>
  );
}

export default Navbar;