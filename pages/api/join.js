import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { discord_id, guild_id } = req.body;

  if (!discord_id || !guild_id) {
    return res.status(400).json({ error: 'Missing discord_id or guild_id' });
  }

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  try {
    const result = await pool.query(
      'SELECT access_token FROM discord_users WHERE discord_id = $1',
      [discord_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { access_token } = result.rows[0];

    await axios.put(
      `https://discord.com/api/v10/guilds/${guild_id}/members/${discord_id}`,
      { access_token },
      {
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({ success: true, message: `User ${discord_id} added to guild ${guild_id}` });
  } catch (err) {
    const discordError = err?.response?.data;
    console.error('Join error:', discordError || err.message);
    return res.status(500).json({ error: discordError || 'Failed to add user to server' });
  }
}
