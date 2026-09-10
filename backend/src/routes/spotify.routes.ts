import { Router } from "express";

import { getUserTopTracks } from "../controllers/spotify.controller.js";

const router = Router();

router.get("/top-tracks", getUserTopTracks);

export default router;