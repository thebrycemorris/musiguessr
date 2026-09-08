import type { Request, Response } from "express";

export const getHealth = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
    },
  });
};