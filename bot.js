const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1473394152023654430';
const APP_URL = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

const commands = [
  new SlashCommandBuilder()
    .setName('setup-verify')
    .setDescription('Set up the verification system for this server')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel where the verify button will be posted')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('Role to give users after they verify')
        .setRequired(true)
    )
    .toJSON()
];

client.once('ready', async () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Slash commands registered globally');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'setup-verify') return;

  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('channel');
  const role = interaction.options.getRole('role');
  const guildId = interaction.guildId;

  const verifyUrl = `${APP_URL}/verify?guild=${guildId}&role=${role.id}`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('✅ Verify')
      .setStyle(ButtonStyle.Link)
      .setURL(verifyUrl)
  );

  try {
    const msg = await channel.send({
      embeds: [{
        title: '🔐 Server Verification',
        description: 'Click the **Verify** button below to verify yourself and gain access to the server.',
        color: 0x5865F2,
        footer: { text: 'You will be asked to authorize with Discord' }
      }],
      components: [row]
    });

    await pool.query(
      `INSERT INTO verification_configs (guild_id, channel_id, role_id, message_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (guild_id) DO UPDATE SET
         channel_id = EXCLUDED.channel_id,
         role_id = EXCLUDED.role_id,
         message_id = EXCLUDED.message_id`,
      [guildId, channel.id, role.id, msg.id]
    );

    await interaction.editReply({
      content: `✅ Verification set up!\n📌 Channel: ${channel}\n🎭 Role: ${role}\n\nUsers who click Verify will automatically receive the role after authorizing.`
    });
  } catch (err) {
    console.error('Setup error:', err);
    await interaction.editReply({ content: `❌ Error: ${err.message}` });
  }
});

client.login(BOT_TOKEN);
