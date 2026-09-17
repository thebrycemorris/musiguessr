# Musiguessr

Musiguessr is a Spotify-powered music game. Guess songs from your listening history, play the daily artist and album trivia challenge, discover new music, and compare scores on the leaderboard.

## What It Uses

- React, TypeScript, Vite, and React Router
- Node.js, Express, and TypeScript
- SQLite through `better-sqlite3`
- Spotify Web API and Spotify Web Playback SDK

## Install Requirements

Install these before setting up the project:

- Git, to clone the repository
- Node.js 20 or newer, which includes npm
- A Spotify account; Spotify Premium is required for playback features
- A Spotify Developer app with a client ID and client secret

You do not need to install SQLite separately or install any packages globally. The project dependencies are installed locally with npm.

## Run It Locally

Clone the repository and enter its folder:

```powershell
git clone https://github.com/thebrycemorris/musiguessr.git
cd musiguessr
```

1. Create a Spotify Developer app and copy its client ID and secret.
2. In `backend/`, copy `.env.example` to `.env`:

	```powershell
	Copy-Item .env.example .env
	```

	Then open `backend/.env` and add your credentials:

	```env
	SPOTIFY_CLIENT_ID=your_client_id
	SPOTIFY_CLIENT_SECRET=your_client_secret
	SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/spotify/callback
	FRONTEND_URL=http://localhost:5173
	```

3. Register the redirect URI above in the Spotify Developer Dashboard.
4. Start the API in one terminal:

	```powershell
	cd backend
	npm install
	npm run dev
	```

5. Start the website in another terminal:

	```powershell
	cd frontend
	npm install
	npm run dev
	```

6. Open [http://localhost:5173](http://localhost:5173), choose **Log in**, and connect Spotify.

The backend creates its SQLite database at `backend/data/musiguessr.db`. Keep that folder when moving or backing up a local installation.

## Project Structure

- `frontend/` - React/Vite website
- `backend/` - Express API and SQLite database