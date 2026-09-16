# Musiguessr

Musiguessr is a Spotify-powered music game. Play timed rounds using your own listening data, complete daily artist and album trivia, compare scores on the global leaderboard, and discover new tracks.

## Features

- Spotify login and Web Playback
- Timed song-guessing rounds with decreasing score values
- Daily multiple-choice trivia about artists and albums
- Discovery mode and personalized top-track rounds
- Profiles, friends, game history, and a global leaderboard
- Installable frontend PWA shell

## Tech Stack

- React 19, TypeScript, React Router, and Vite
- Node.js, Express, and TypeScript
- SQLite with `better-sqlite3`
- Spotify Web API and Spotify Web Playback SDK

## Repository Layout

- `frontend/` - React/Vite client
- `backend/` - Express API and SQLite database
- `backend/data/` - Runtime SQLite data directory

## Local Development

### Prerequisites

- Node.js 20 or newer
- A Spotify Premium account for Web Playback
- A Spotify Developer application

### Configure the backend

```powershell
cd backend
Copy-Item .env.example .env
```

Set these values in `backend/.env`:

```env
PORT=3000
NODE_ENV=development
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:5173
```

Register the redirect URI in the Spotify Developer Dashboard.

### Configure and run the frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend uses `VITE_API_URL` for API requests. The default points to the local backend:

```env
VITE_API_URL=http://127.0.0.1:3000
```

In a second terminal:

```powershell
cd backend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser.

## Production Builds

Build the frontend:

```powershell
cd frontend
npm run build
```

The static output is written to `frontend/dist`.

Build and start the backend:

```powershell
cd backend
npm run build
npm start
```

The backend output is written to `backend/dist` and listens on `PORT`.

## Deployment Checklist

1. Deploy the backend as a Node.js service and set the backend environment variables.
2. Set `SPOTIFY_REDIRECT_URI` to the public callback URL and register it with Spotify.
3. Set `FRONTEND_URL` to the public frontend URL.
4. Build the frontend with `VITE_API_URL` set to the public backend URL.
5. Serve `frontend/dist` as a static site with SPA fallback to `index.html`.
6. Give the backend persistent storage for `backend/data/musiguessr.db`; SQLite data is not suitable for an ephemeral filesystem.
7. Configure CORS and HTTPS for the final frontend and backend domains.

Never commit `.env` files or Spotify client secrets. Use the hosting provider's secret/environment-variable manager for production values.

## Suggested First Deployment

This repository includes provider configuration for a Vercel frontend and a Render backend.

### Backend on Render

1. Create a new Render Blueprint from the `deployment` branch.
2. Select this repository; Render will use `render.yaml`.
3. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` as secrets.
4. Set `FRONTEND_URL` after Vercel provides the frontend URL.
5. Set `SPOTIFY_REDIRECT_URI` to `https://YOUR-API.onrender.com/api/auth/spotify/callback`.
6. Register that exact callback URL in the Spotify Developer Dashboard.

The Blueprint includes a persistent disk for the SQLite database. A Render plan with persistent disk support is required.

### Frontend on Vercel

1. Import the repository into Vercel and select the `deployment` branch.
2. Set the project root directory to `frontend`.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Add `VITE_API_URL=https://YOUR-API.onrender.com` as a production environment variable.
5. Deploy, then copy the Vercel URL into Render's `FRONTEND_URL` value.

`frontend/vercel.json` provides the SPA fallback required by React Router. After both services are deployed, use the Vercel URL as the public app address.