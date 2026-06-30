require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "https://mohammad-masoumi.github.io,http://localhost:5500,http://127.0.0.1:5500")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const VALID_STATUSES = new Set(["Lost", "Found"]);
const VALID_CATEGORIES = new Set(["Phone", "Wallet", "Keys", "Bag", "Bike", "Pet", "ID / Documents", "Other"]);
const VALID_AREAS = new Set(["Downtown", "Kitsilano", "UBC", "Burnaby", "North Vancouver", "Richmond", "Surrey", "Other"]);

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. On Render, attach the Postgres database through render.yaml.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false }
});

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "50kb" }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}));

app.get("/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok", service: "vanlostandfound-api" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/items", async (request, response, next) => {
  try {
    const { search, status, category, area } = request.query;
    const values = [];
    const where = [];

    if (status && VALID_STATUSES.has(status)) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }

    if (category && VALID_CATEGORIES.has(category)) {
      values.push(category);
      where.push(`category = $${values.length}`);
    }

    if (area && VALID_AREAS.has(area)) {
      values.push(area);
      where.push(`area = $${values.length}`);
    }

    if (typeof search === "string" && search.trim()) {
      values.push(`%${search.trim()}%`);
      where.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length} OR category ILIKE $${values.length} OR area ILIKE $${values.length})`);
    }

    const query = `
      SELECT id, status, category, title, description, area, event_date AS date, contact, created_at
      FROM items
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, values);
    response.json({ items: result.rows.map(mapItemRow) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/items", async (request, response, next) => {
  try {
    const item = validateItemInput(request.body);
    const id = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO items (id, status, category, title, description, area, event_date, contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, status, category, title, description, area, event_date AS date, contact, created_at`,
      [id, item.status, item.category, item.title, item.description, item.area, item.date, item.contact]
    );

    response.status(201).json({ item: mapItemRow(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.use((request, response) => {
  response.status(404).json({ error: `Route not found: ${request.method} ${request.path}` });
});

app.use((error, _request, response, _next) => {
  if (error.statusCode) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  if (error.message && error.message.includes("not allowed by CORS")) {
    return response.status(403).json({ error: "This origin is not allowed to access the API." });
  }

  console.error(error);
  return response.status(500).json({ error: "Internal server error" });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`VanLost & Found API listening on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('Lost', 'Found')),
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      area TEXT NOT NULL,
      event_date DATE NOT NULL,
      contact TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query("CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_items_status ON items (status)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_items_category ON items (category)");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_items_area ON items (area)");

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM items");
  if (rows[0].count === 0) {
    await seedDatabase();
  }
}

async function seedDatabase() {
  const today = new Date();
  const seedItems = [
    {
      status: "Found",
      category: "Bag",
      title: "Black backpack near Waterfront Station",
      description: "Found by the main entrance. Owner should be able to describe the contents and brand.",
      area: "Downtown",
      date: formatOffsetDate(today, 0),
      contact: "waterfront-desk@example.com"
    },
    {
      status: "Lost",
      category: "Wallet",
      title: "Brown leather wallet",
      description: "Last seen around Kits Beach. Contains cards with initials M.M. Reward offered.",
      area: "Kitsilano",
      date: formatOffsetDate(today, -1),
      contact: "text 604-555-0198"
    },
    {
      status: "Found",
      category: "Keys",
      title: "Key ring with blue fob",
      description: "Found on a bench near SFU Burnaby transit loop. Includes two silver keys.",
      area: "Burnaby",
      date: formatOffsetDate(today, -2),
      contact: "campus security front desk"
    },
    {
      status: "Lost",
      category: "Phone",
      title: "iPhone with clear case",
      description: "Lost on the 99 B-Line toward UBC. Lock screen has a dog photo.",
      area: "UBC",
      date: formatOffsetDate(today, -3),
      contact: "vanlost.phone@example.com"
    },
    {
      status: "Found",
      category: "ID / Documents",
      title: "Student card",
      description: "Found at a coffee shop counter. Name is hidden for privacy; describe the school and photo.",
      area: "North Vancouver",
      date: formatOffsetDate(today, -4),
      contact: "manager at the cafe counter"
    },
    {
      status: "Lost",
      category: "Bike",
      title: "Matte green commuter bike",
      description: "Last locked near Richmond-Brighouse. Has a rear rack and bell with a scratch mark.",
      area: "Richmond",
      date: formatOffsetDate(today, -5),
      contact: "bike-owner@example.com"
    }
  ];

  for (const item of seedItems) {
    await pool.query(
      `INSERT INTO items (id, status, category, title, description, area, event_date, contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [crypto.randomUUID(), item.status, item.category, item.title, item.description, item.area, item.date, item.contact]
    );
  }
}

function validateItemInput(input) {
  const item = {
    status: clean(input.status),
    category: clean(input.category),
    title: clean(input.title),
    description: clean(input.description),
    area: clean(input.area),
    date: clean(input.date),
    contact: clean(input.contact)
  };

  if (!VALID_STATUSES.has(item.status)) throw badRequest("Choose Lost or Found.");
  if (!VALID_CATEGORIES.has(item.category)) throw badRequest("Choose a valid category.");
  if (!VALID_AREAS.has(item.area)) throw badRequest("Choose a valid area.");
  if (item.title.length < 3 || item.title.length > 80) throw badRequest("Title must be 3-80 characters.");
  if (item.description.length < 10 || item.description.length > 260) throw badRequest("Description must be 10-260 characters.");
  if (item.contact.length < 3 || item.contact.length > 90) throw badRequest("Contact method must be 3-90 characters.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || Number.isNaN(Date.parse(`${item.date}T12:00:00Z`))) {
    throw badRequest("Date must use YYYY-MM-DD format.");
  }

  return item;
}

function clean(value) {
  return String(value || "").trim();
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function mapItemRow(row) {
  return {
    id: row.id,
    status: row.status,
    category: row.category,
    title: row.title,
    description: row.description,
    area: row.area,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
    contact: row.contact,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function formatOffsetDate(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
