import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const usersResult = await pool.query(
      `SELECT discord_id, username, discriminator, email, avatar,
              verified_guild_id, verified_role_id, verified_at,
              created_at, updated_at
       FROM discord_users ORDER BY created_at DESC`
    );

    const guildsResult = await pool.query(
      `SELECT discord_id, guild_id, name, owner FROM discord_guilds ORDER BY discord_id`
    );

    const guildsByUser = {};
    for (const g of guildsResult.rows) {
      if (!guildsByUser[g.discord_id]) guildsByUser[g.discord_id] = [];
      guildsByUser[g.discord_id].push({ id: g.guild_id, name: g.name, owner: g.owner });
    }

    const users = usersResult.rows.map(u => ({
      ...u,
      guilds: guildsByUser[u.discord_id] || [],
    }));

    return res.status(200).json({ total: users.length, users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
}
