// api/final-window.js
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Без авторизации: берём последнего созданного игрока
    const { rows } = await pool.query(`
      SELECT next_final_window, last_final_submit
      FROM players
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!rows.length) {
      // Если таблица пуста
      return res.status(200).json({ msLeft: 0, canSubmit: false });
    }

    const { next_final_window, last_final_submit } = rows[0];
    const now = new Date();
    const openTime = new Date(next_final_window);
    const msLeftRaw = openTime - now;
    const msLeft = msLeftRaw > 0 ? msLeftRaw : 0;

    // Проверяем, не отправлял ли он сегодня
    const sentToday =
      last_final_submit &&
      now - new Date(last_final_submit) < 24 * 60 * 60 * 1000;

    const canSubmit = msLeft === 0 && !sentToday;

    return res.status(200).json({ msLeft, canSubmit });
  } catch (err) {
    console.error('[/api/final-window] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
