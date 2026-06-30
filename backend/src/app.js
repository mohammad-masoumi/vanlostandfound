import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import {
  createItem,
  deleteItem,
  getItemById,
  initializeStore,
  listItems,
  resetToSeedItems,
  updateItem
} from "./store.js";
import {
  normalizeQuery,
  validateCreateListing,
  validateUpdateListing
} from "./validation.js";

export async function createApp() {
  await initializeStore();

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: getAllowedOrigins() }));
  app.use(express.json({ limit: "20kb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", service: "vanlostandfound-api" });
  });

  app.get("/api/items", async (request, response, next) => {
    try {
      const items = await listItems(normalizeQuery(request.query));
      response.json({ items, count: items.length });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/items/:id", async (request, response, next) => {
    try {
      const item = await getItemById(request.params.id);
      if (!item) return response.status(404).json({ error: "Listing not found." });
      response.json({ item });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/items", async (request, response, next) => {
    try {
      const { value, errors } = validateCreateListing(request.body);
      if (errors.length > 0) return response.status(400).json({ errors });

      const item = await createItem(value);
      response.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/items/:id", requireAdminToken, async (request, response, next) => {
    try {
      const { value, errors } = validateUpdateListing(request.body);
      if (errors.length > 0) return response.status(400).json({ errors });

      const item = await updateItem(request.params.id, value);
      if (!item) return response.status(404).json({ error: "Listing not found." });

      response.json({ item });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/items/:id", requireAdminToken, async (request, response, next) => {
    try {
      const deleted = await deleteItem(request.params.id);
      if (!deleted) return response.status(404).json({ error: "Listing not found." });
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/items/reset-demo", requireAdminToken, async (_request, response, next) => {
    try {
      const items = await resetToSeedItems();
      response.json({ items, count: items.length });
    } catch (error) {
      next(error);
    }
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found." });
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: "Something went wrong on the server." });
  });

  return app;
}

function requireAdminToken(request, response, next) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) return next();

  const providedToken = request.get("x-admin-token");
  if (providedToken !== adminToken) {
    return response.status(401).json({ error: "Valid admin token required." });
  }

  return next();
}

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGIN;
  if (!configuredOrigins) return true;

  return configuredOrigins
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}
