// server/libsql.js — טוען .env מה-root ומתחבר ל-Turso (libSQL)
import process from 'node:process';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טען .env מהתיקייה הראשית של הפרויקט (תיקיית האב של server)
config({ path: path.resolve(__dirname, '..', '.env') });

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is missing (check root .env)');
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is missing (check root .env)');
}

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function q(sql, args = []) {
  const rs = await db.execute({ sql, args });
  return rs.rows;
}
