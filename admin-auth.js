export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;
  const correct = process.env.ADMIN_PASSWORD;

  if (!correct) return res.status(500).json({ error: 'Admin password not set' });
  if (password !== correct) return res.status(401).json({ error: 'Wrong password' });

  return res.status(200).json({ ok: true });
}
