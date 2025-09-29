import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';

const app = express();
app.use(express.json());

// Restrict CORS in production: put your frontend origin(s) here
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// DB client (Turso / libSQL)
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Ensure table exists (simple auto-migration)
async function ensureSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
ensureSchema().catch(err => {
  console.error('Schema init failed:', err);
  process.exit(1);
});

app.get('/api/health', async (_req, res) => {
  try {
    const rs = await db.execute("select 'ok' as status;");
    res.json({ ok: true, db: rs.rows[0].status });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/api/items', async (_req, res) => {
  const rs = await db.execute('SELECT id, title, created_at FROM items ORDER BY id DESC;');
  res.json(rs.rows);
});

app.post('/api/items', async (req, res) => {
  const { title } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const rs = await db.execute({
    sql: 'INSERT INTO items (title) VALUES (?) RETURNING id, title, created_at;',
    args: [title]
  });
  res.status(201).json(rs.rows[0]);
});

app.delete('/api/items/:id', async (req, res) => {
  const id = Number(req.params.id);
  await db.execute({ sql: 'DELETE FROM items WHERE id = ?;', args: [id] });
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log('where-the-hell API listening on :' + port));
