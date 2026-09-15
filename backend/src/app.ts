import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import databaseRoutes from "./routes/database.routes.js";
import authRoutes from "./routes/auth.routes.js";
import spotifyRoutes from "./routes/spotify.routes.js";
import communityRoutes from "./routes/community.routes.js";

import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/db-test", databaseRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/community", communityRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;