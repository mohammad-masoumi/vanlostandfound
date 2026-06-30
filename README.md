# VanLost & Found

A clean website for reporting and browsing lost and found items around Vancouver.

## Features

- Responsive landing page for a community lost-and-found board
- Search and filters by keyword, status, category, and area
- Report form for lost or found items
- Express backend API for shared listings
- JSON-file persistence for simple local deployment
- Browser `localStorage` fallback when the backend is unavailable
- Safe handoff reminders and privacy-conscious item descriptions
- GitHub Pages deployment workflow for the static frontend

## Project structure

```text
.
├── index.html          # Static frontend
├── styles.css          # Frontend styles
├── app.js              # Frontend logic with API + localStorage fallback
└── backend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── app.js      # Express routes and middleware
        ├── server.js   # API server entry point
        ├── store.js    # JSON-file persistence
        └── validation.js
```

## Backend API

The backend exposes these endpoints:

```text
GET    /api/health
GET    /api/items?search=&status=&category=&area=
GET    /api/items/:id
POST   /api/items
PATCH  /api/items/:id
DELETE /api/items/:id
POST   /api/items/reset-demo
```

`POST /api/items` accepts this JSON body:

```json
{
  "status": "Lost",
  "category": "Wallet",
  "title": "Brown leather wallet",
  "description": "Last seen near Kits Beach.",
  "area": "Kitsilano",
  "date": "2026-06-30",
  "contact": "text 604-555-0198"
}
```

Allowed values match the frontend dropdowns:

- `status`: `Lost`, `Found`
- `category`: `Phone`, `Wallet`, `Keys`, `Bag`, `Bike`, `Pet`, `ID / Documents`, `Other`
- `area`: `Downtown`, `Kitsilano`, `UBC`, `Burnaby`, `North Vancouver`, `Richmond`, `Surrey`, `Other`

## Run the backend locally

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API runs at:

```text
http://localhost:3000
```

## Connect the frontend to the backend

When the frontend and backend are served from the same origin, the frontend automatically tries `/api/items`.

For a separately hosted backend, set this before `app.js` loads:

```html
<script>
  window.VANLOST_API_BASE_URL = "https://your-api.example.com";
</script>
<script src="app.js"></script>
```

If the API is not reachable, the frontend falls back to browser-only demo mode using `localStorage`.

## Environment variables

Create `backend/.env` from `backend/.env.example`.

```text
PORT=3000
CORS_ORIGIN=
ADMIN_TOKEN=
DATA_FILE=
```

Notes:

- `CORS_ORIGIN` can be a comma-separated list such as `https://mohammad-masoumi.github.io,http://localhost:5500`.
- If `ADMIN_TOKEN` is set, `PATCH`, `DELETE`, and `reset-demo` require the `x-admin-token` header.
- `DATA_FILE` defaults to `backend/data/items.json`.

## Live site

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

After GitHub Pages is enabled for this repository with **Source: GitHub Actions**, the static site will publish automatically on every push to `main`.

Expected Pages URL:

```text
https://mohammad-masoumi.github.io/vanlostandfound/
```

## Important deployment note

GitHub Pages hosts only the static frontend. To make listings shared between all visitors, deploy the `backend/` folder to a Node hosting provider such as Render, Railway, Fly.io, or a VPS, then set `window.VANLOST_API_BASE_URL` in `index.html` to the deployed API URL.
