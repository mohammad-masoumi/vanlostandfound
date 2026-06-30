# VanLost & Found

A Vancouver lost-and-found website with a GitHub Pages frontend and a Render-hosted backend API.

## Architecture

- Frontend: static HTML, CSS, and JavaScript, published with GitHub Pages.
- Backend: Node.js and Express API in the `server/` folder, designed for Render Web Services.
- Database: PostgreSQL on Render for shared persistent listings.

## Features

- Responsive lost-and-found landing page
- Render backend API integration for shared listings
- Search and filters by keyword, status, category, and area
- Report form that saves new listings to PostgreSQL
- CORS restricted to the GitHub Pages origin and local development origins
- Render health check endpoint at `/health`

## Expected URLs

Frontend:

```text
https://mohammad-masoumi.github.io/vanlostandfound/
```

Backend, if Render accepts the configured service name:

```text
https://vanlostandfound-api.onrender.com
```

The frontend API URL is configured in `config.js`. If Render gives the backend a different URL, update `productionApiUrl` in that file.

## Deploy the backend on Render

Use Render for the backend. GitHub Pages is only for the static frontend.

1. Create a Render PostgreSQL database.
2. Create a Render Web Service from this repository.
3. Set Root Directory to `server`.
4. Set Build Command to `npm install`.
5. Set Start Command to `npm start`.
6. Set Health Check Path to `/health`.
7. In Render service settings, add environment variables for production mode, the database connection URL, and allowed CORS origins.
8. Deploy the service.

Use this CORS origins value:

```text
https://mohammad-masoumi.github.io,http://localhost:5500,http://127.0.0.1:5500
```

The repo also includes `render.yaml` as a starting Blueprint file for Render.

## API endpoints

```text
GET  /health
GET  /api/items
POST /api/items
```

## Local development

Backend:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
python3 -m http.server 5500
```

Then open `http://localhost:5500`.

## Privacy note

This app is public by design. Do not post full ID numbers, home addresses, or highly sensitive details. For found items, ask claimants to describe private identifying details before handoff.
