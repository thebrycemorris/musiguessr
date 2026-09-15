import { Router } from "express";
import {
  loginWithSpotify,
  spotifyCallback,
  updateProfile,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/spotify", loginWithSpotify);
router.get("/spotify/callback", spotifyCallback);
router.put("/profile", updateProfile);

export default router;