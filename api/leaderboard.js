// api/leaderboard.js
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json([]);

  const scope = req.query.scope || 'global';

  try {
    if (scope === 'global') {
      const { rows } = await pool.query(`
        SELECT
          tg_id::text,
          name,
          array_length(fragments, 1) AS fragmentsCount
        FROM players
        ORDER BY fragmentsCount DESC
        LIMIT 100;
      `);
      // rows всегда массив
      return res.status(200).json(rows);
    }
    // для друзей — пока пустой массив
    return res.status(200).json([]);
  } catch (err) {
    console.error('[/api/leaderboard] error:', err);
    // на всякий случай возвращаем массив, чтобы фронт не упал
    return res.status(500).json([]);
  }
}
