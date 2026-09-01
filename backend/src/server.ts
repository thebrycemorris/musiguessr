import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Musiguessr API running on port ${PORT}`);
});