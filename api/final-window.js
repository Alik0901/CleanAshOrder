// api/final-window.js
export default async function handler(req, res) {
  // Всегда возвращаем: окно открыто, можно сразу вводить
  return res.status(200).json({ msLeft: 0, canSubmit: true });
}
