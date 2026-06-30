# Render backend setup

Use Render for the backend. The frontend remains on GitHub Pages.

## Service settings

Create a Render Web Service from this repo with:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

Create a Render PostgreSQL database and add its internal connection URL to the web service as the environment variable named `DATABASE_URL`.

Also add:

```text
NODE_ENV=production
CORS_ORIGINS=https://mohammad-masoumi.github.io,http://localhost:5500,http://127.0.0.1:5500
```

The frontend expects the API at:

```text
https://vanlostandfound-api.onrender.com
```

If Render gives the service a different URL, update `productionApiUrl` in `config.js`.
