// api/leaderboard.js
import { Pool } from 'pg';

// Подключаемся к БД по переменной окружения
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const scope = req.query.scope || 'global';

  try {
    if (scope === 'global') {
      // Глобальный топ по числу фрагментов
      const { rows } = await pool.query(`
        SELECT
          tg_id,
          name,
          array_length(fragments, 1) AS fragmentsCount
        FROM players
        ORDER BY fragmentsCount DESC
        LIMIT 100
      `);
      return res.status(200).json(rows);
    }

    if (scope === 'friends') {
      // Пока не поддерживаем — возвращаем пустой список
      return res.status(200).json([]);
    }

    // Неправильный параметр scope
    return res.status(400).json({ error: 'Invalid scope parameter' });
  } catch (error) {
    console.error('[/api/leaderboard] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
