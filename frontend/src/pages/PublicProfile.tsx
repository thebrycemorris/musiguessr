import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { API_URL } from "../config/api";
import "../styles/feature-pages.css";

type PublicUser = {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  favoriteGenre: string | null;
  createdAt: string;
};

function PublicProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/community/users/${userId}`)
      .then((response) => response.json())
      .then((result) => setUser(result.data?.user ?? null));
  }, [userId]);

  if (!user) {
    return <main className="feature-page feature-empty-state"><p>Loading profile...</p></main>;
  }

  return (
    <main className="feature-page public-profile-page">
      <section className="feature-page-header">
        <p className="feature-eyebrow">Player profile</p>
        <h1>{user.displayName ?? "Spotify User"}</h1>
        <p>{user.bio || "A Musiguessr player."}</p>
      </section>
      <section className="feature-panel public-profile-card">
        {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <div>{user.displayName?.charAt(0) ?? "S"}</div>}
        <span>{user.favoriteGenre || "Music lover"}</span>
        <small>Joined {new Date(user.createdAt).toLocaleDateString()}</small>
      </section>
    </main>
  );
}

export default PublicProfile;
