import { Router } from "express";

import {
  getUserRecommendations,
  getUserTopTracks,
  getAccessToken,
  playTrack,
  getDiscoverTracks,
  searchDiscoverTracks,
} from "../controllers/spotify.controller.js";

const router = Router();

router.get("/top-tracks", getUserTopTracks);
router.get("/recommendations", getUserRecommendations);
router.get("/discover", getDiscoverTracks);
router.get("/discover/search", searchDiscoverTracks);
router.get("/access-token", getAccessToken);
router.put("/play", playTrack);

export default router;