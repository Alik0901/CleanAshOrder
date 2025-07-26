// api/leaderboard.js
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  const scope = req.query.scope || 'global';

  try {
    let rows;
    if (scope === 'global') {
      // глобальный топ по фрагментам
      const { rows: all } = await pool.query(
        `SELECT tg_id, name, array_length(fragments, 1) as fragments_count
         FROM players
         ORDER BY fragments_count DESC
         LIMIT 100`
      );
      rows = all;
    } else {
      // TODO: логика «friends» — если храните рефералов, то join players + referrals
      const { rows: friends } = await pool.query(
        `SELECT p.tg_id, p.name, array_length(p.fragments, 1) as fragments_count
         FROM players p
         JOIN referrals r ON r.referrer_id = p.id
         WHERE r.referred_id = $1
         ORDER BY fragments_count DESC`,
        [/* ваш текущий user.id */]
      );
      rows = friends;
    }

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB query failed' });
  }
}
