import { Router } from "express";
import {
  addFriend,
  getGlobalLeaderboard,
  getFriends,
  getUserProfile,
  saveGameResult,
  searchUsers,
} from "../controllers/community.controller.js";

const router = Router();

router.get("/leaderboard", getGlobalLeaderboard);
router.get("/friends", getFriends);
router.post("/games", saveGameResult);
router.get("/users", searchUsers);
router.get("/users/:userId", getUserProfile);
router.post("/friends", addFriend);

export default router;