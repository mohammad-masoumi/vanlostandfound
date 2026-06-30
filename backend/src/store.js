import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AREAS, CATEGORIES, STATUSES } from "./validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_FILE = path.resolve(__dirname, "..", "data", "items.json");
const DATA_FILE = process.env.DATA_FILE ? path.resolve(process.env.DATA_FILE) : DEFAULT_DATA_FILE;

function createSeedItems() {
  const now = Date.now();

  return [
    {
      id: "seed-backpack-waterfront",
      status: "Found",
      category: "Bag",
      title: "Black backpack near Waterfront Station",
      description: "Found by the main entrance. Owner should be able to describe the contents and brand.",
      area: "Downtown",
      date: todayOffset(0),
      contact: "waterfront-desk@example.com",
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString()
    },
    {
      id: "seed-wallet-kitsilano",
      status: "Lost",
      category: "Wallet",
      title: "Brown leather wallet",
      description: "Last seen around Kits Beach. Contains cards with initials M.M. Reward offered.",
      area: "Kitsilano",
      date: todayOffset(-1),
      contact: "text 604-555-0198",
      createdAt: new Date(now - 86_400_000).toISOString(),
      updatedAt: new Date(now - 86_400_000).toISOString()
    },
    {
      id: "seed-keys-sfu",
      status: "Found",
      category: "Keys",
      title: "Key ring with blue fob",
      description: "Found on a bench near SFU Burnaby transit loop. Includes two silver keys.",
      area: "Burnaby",
      date: todayOffset(-2),
      contact: "campus security front desk",
      createdAt: new Date(now - 172_800_000).toISOString(),
      updatedAt: new Date(now - 172_800_000).toISOString()
    }
  ];
}

export async function initializeStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeItems(createSeedItems());
  }
}

export async function listItems(filters = {}) {
  const items = await readItems();
  const search = filters.search?.toLowerCase();

  return items
    .filter(item => {
      const matchesSearch = !search || [
        item.title,
        item.description,
        item.category,
        item.area,
        item.status
      ].join(" ").toLowerCase().includes(search);

      return (
        matchesSearch &&
        (!filters.status || item.status === filters.status) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.area || item.area === filters.area)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getItemById(id) {
  const items = await readItems();
  return items.find(item => item.id === id) ?? null;
}

export async function createItem(input) {
  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now
  };

  const items = await readItems();
  await writeItems([item, ...items]);
  return item;
}

export async function updateItem(id, updates) {
  const items = await readItems();
  const index = items.findIndex(item => item.id === id);

  if (index === -1) return null;

  const updatedItem = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  items[index] = updatedItem;
  await writeItems(items);
  return updatedItem;
}

export async function deleteItem(id) {
  const items = await readItems();
  const filteredItems = items.filter(item => item.id !== id);

  if (filteredItems.length === items.length) return false;

  await writeItems(filteredItems);
  return true;
}

export async function resetToSeedItems() {
  const seedItems = createSeedItems();
  await writeItems(seedItems);
  return seedItems;
}

async function readItems() {
  await initializeStoreIfNeeded();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw || "[]");

  if (!Array.isArray(parsed)) {
    throw new Error("The item store must contain a JSON array.");
  }

  return parsed.filter(isStoredItem);
}

async function initializeStoreIfNeeded() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await initializeStore();
  }
}

async function writeItems(items) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tempFile = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

function isStoredItem(item) {
  return Boolean(
    item &&
    typeof item.id === "string" &&
    STATUSES.includes(item.status) &&
    CATEGORIES.includes(item.category) &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    AREAS.includes(item.area) &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.contact === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
