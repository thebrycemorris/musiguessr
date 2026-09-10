import type { Request, Response } from "express";
import db from "../config/database.js";

export const testDatabase = (_req: Request, res: Response) => {
  const result = db
    .prepare("SELECT datetime('now') AS currentTime")
    .get();

  res.json({
    success: true,
    data: {
      database: "connected",
      result,
    },
  });
};