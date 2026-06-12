import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function saveUser({ discord_id, username, discriminator, email, avatar, access_token, refresh_token, verified_guild_id, verified_role_id, verified_at }) {
  await pool.query(
    `INSERT INTO discord_users (discord_id, username, discriminator, email, avatar, access_token, refresh_token, verified_guild_id, verified_role_id, verified_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (discord_id) DO UPDATE SET
       username = EXCLUDED.username,
       discriminator = EXCLUDED.discriminator,
       email = EXCLUDED.email,
       avatar = EXCLUDED.avatar,
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       verified_guild_id = COALESCE(EXCLUDED.verified_guild_id, discord_users.verified_guild_id),
       verified_role_id = COALESCE(EXCLUDED.verified_role_id, discord_users.verified_role_id),
       verified_at = COALESCE(EXCLUDED.verified_at, discord_users.verified_at),
       updated_at = NOW()`,
    [discord_id, username, discriminator, email, avatar, access_token, refresh_token,
     verified_guild_id || null, verified_role_id || null, verified_at || null]
  );
}

export async function saveGuilds(discord_id, guilds) {
  await pool.query('DELETE FROM discord_guilds WHERE discord_id = $1', [discord_id]);
  for (const g of guilds) {
    await pool.query(
      `INSERT INTO discord_guilds (guild_id, discord_id, name, icon, owner)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (guild_id, discord_id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, owner = EXCLUDED.owner`,
      [g.id, discord_id, g.name, g.icon || null, g.owner || false]
    );
  }
}
