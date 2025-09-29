import { q } from './libsql.js';

const tables = ['departments','employees','floors','roles','rooms'];

for (const t of tables) {
  const rows = await q(`SELECT COUNT(*) AS c FROM ${t};`);
  console.log(t, rows[0]?.c);
}

const ping = await q('SELECT 1 AS ok;');
console.log('ping:', ping[0]?.ok);
