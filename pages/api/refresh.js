import axios from 'axios';

const clientID = process.env.DISCORD_CLIENT_ID || '1473394152023654430';
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI || 'https://discord-oauth-2-nextjs-app--ABGAMING6.replit.app/redirect';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' });

  try {
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        refresh_token,
        grant_type: 'refresh_token',
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uri,
        scope: 'identify email guilds guilds.join bot',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token: new_refresh_token } = tokenRes.data;
    return res.status(200).json({ access_token, refresh_token: new_refresh_token });
  } catch (err) {
    console.error('Refresh error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Refresh failed' });
  }
}
