import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createApiHandler } from "./api-handler";
import { assertProductionAuthConfiguration, isDemoModeEnabled } from "./modules/auth";
import { getRepository } from "./db/repository";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  assertProductionAuthConfiguration();
  const app = express();
  const server = createServer(app);
  const repo = getRepository();

  // Mount Bharat CultureMap REST API (/api/v1/*)
  const apiHandler = createApiHandler(repo);
  app.use((req, res, next) => {
    void apiHandler(req, res, next);
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(
      `Bharat CultureMap server running on http://localhost:${port}/ (DB driver: ${repo.driverName}, demoAccounts: ${isDemoModeEnabled() ? "enabled" : "disabled"})`
    );
  });
}

startServer().catch(console.error);
