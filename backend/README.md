# where-the-hell — Backend
Minimal Express API using Turso (libSQL/SQLite).

## Local dev
1) Copy `.env.example` to `.env` and fill in the Turso URL/token.
2) Install deps and run:
   ```bash
   npm install
   npm run dev
   ```
3) Open http://localhost:8080/api/health

## Endpoints
- GET  /api/health
- GET  /api/items
- POST /api/items   { "title": "..." }
- DELETE /api/items/:id
