import app from "./app.js";
import { env } from "./config/env.js";
import { initializeDatabase } from "./config/initDatabase.js";

initializeDatabase();

app.listen(env.port, () => {
  console.log(`Musiguessr API running on port ${env.port}`);
});