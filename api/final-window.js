// api/final-window.js
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Предположим, что в таблице players у вас есть поля:
//   next_final_window  — timestamp, когда откроется окно
//   last_final_submit  — timestamp последней успешной отправки
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Получаем данные по текущему игроку — в простейшем виде забираем из players
    const tgId = req.headers['x-user-tg-id']; // или другой способ аутентификации
    const { rows } = await pool.query(
      'SELECT next_final_window, last_final_submit FROM players WHERE tg_id = $1',
      [tgId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Player not found' });
    }
    const { next_final_window, last_final_submit } = rows[0];
    const now = new Date();
    const openTime = new Date(next_final_window);
    const msLeft = openTime - now;
    const canSubmit = msLeft <= 0 && (!last_final_submit || (now - new Date(last_final_submit) > 24*60*60*1000));
    return res.status(200).json({ msLeft: Math.max(msLeft, 0), canSubmit });
  } catch (err) {
    console.error('[/api/final-window] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
