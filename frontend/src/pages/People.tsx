import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import "../styles/feature-pages.css";

type Person = {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

function People() {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [friends, setFriends] = useState<Person[]>([]);
  const [message, setMessage] = useState("");
  const currentUser = JSON.parse(
    localStorage.getItem("musiguessr_user") ?? "null"
  ) as { id?: number } | null;

  useEffect(() => {
    if (!currentUser?.id) return;

    fetch(`http://127.0.0.1:3000/api/community/friends?userId=${currentUser.id}`)
      .then((response) => response.json())
      .then((result) => setFriends(result.data?.friends ?? []))
      .catch(() => setFriends([]));
  }, [currentUser?.id]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;

    const response = await fetch(
      `http://127.0.0.1:3000/api/community/users?q=${encodeURIComponent(query.trim())}`
    );
    const result = await response.json();
    setPeople(result.data?.users ?? []);
  };

  const handleAddFriend = async (friendId: number) => {
    if (!currentUser?.id) {
      setMessage("Log in to add friends.");
      return;
    }

    await fetch("http://127.0.0.1:3000/api/community/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, friendId }),
    });
    setMessage("Friend added.");
  };

  return (
    <main className="feature-page people-page centered-people-page">
      <section className="feature-page-header">
        <p className="feature-eyebrow">Community</p>
        <h1>Friends</h1>
        <p>Search players, visit profiles, and build your music circle.</p>
      </section>

      <form className="people-search" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by display name"
          aria-label="Search players"
        />
        <button type="submit">Search</button>
      </form>

      {message && <p className="people-message">{message}</p>}

      <section className="friends-section">
        <div className="friends-section-heading">
          <h2>Your friends</h2>
          <span>{friends.length}</span>
        </div>
        {friends.length === 0 ? (
          <p className="friends-empty">Your added friends will appear here.</p>
        ) : (
          <div className="people-grid">
            {friends.map((friend) => (
              <PersonCard key={friend.id} person={friend} />
            ))}
          </div>
        )}
      </section>

      <section className="people-grid">
        {people.map((person) => (
          <PersonCard key={person.id} person={person} onAdd={() => handleAddFriend(person.id)} />
        ))}
      </section>
    </main>
  );
}

function PersonCard({
  person,
  onAdd,
}: {
  person: Person;
  onAdd?: () => void;
}) {
  return (
    <article className="person-card">
      {person.avatarUrl ? <img src={person.avatarUrl} alt="" /> : <span className="person-avatar-fallback">{person.displayName?.charAt(0) ?? "S"}</span>}
      <div>
        <Link to={`/profile/${person.id}`}><h2>{person.displayName ?? "Spotify User"}</h2></Link>
        <p>{person.bio || "Musiguessr player"}</p>
      </div>
      {onAdd && <button type="button" onClick={onAdd}>Add friend</button>}
    </article>
  );
}

export default People;
