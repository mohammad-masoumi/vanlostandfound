# VanLost & Found

A clean static website for reporting and browsing lost and found items around Vancouver.

## Features

- Responsive landing page for a community lost-and-found board
- Demo lost/found item listings
- Search and filters by keyword, status, category, and area
- Report form that saves new demo listings in the visitor's browser with `localStorage`
- Safe handoff reminders and privacy-conscious item descriptions
- GitHub Pages deployment workflow

## Live site

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

After GitHub Pages is enabled for this repository with **Source: GitHub Actions**, the site will publish automatically on every push to `main`.

Expected Pages URL:

```text
https://mohammad-masoumi.github.io/vanlostandfound/
```

## Local preview

Because the site is plain HTML, CSS, and JavaScript, you can preview it by opening `index.html` in a browser.

## Important note

The current report form is a static demo. It stores submissions only in the visitor's browser. To make listings shared between all visitors, connect the form to a backend or database such as Firebase, Supabase, Airtable, or a custom API.
