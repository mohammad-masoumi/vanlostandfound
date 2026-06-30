# VanLost & Found Backend

Express API for VanLost & Found listings.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The API starts on `http://localhost:3000` by default.

## Routes

```text
GET    /api/health
GET    /api/items
GET    /api/items/:id
POST   /api/items
PATCH  /api/items/:id
DELETE /api/items/:id
POST   /api/items/reset-demo
```

## Data storage

Listings are stored in a JSON file. By default, the file is created at `backend/data/items.json`. Use the `DATA_FILE` environment variable to move it somewhere persistent in production.

## Admin protection

Set `ADMIN_TOKEN` in production. When it is set, admin routes require this header:

```text
x-admin-token: your-token
```
