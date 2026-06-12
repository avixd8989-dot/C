# Discord OAuth2 App

A Next.js app for Discord OAuth2 authentication with bot integration and user data storage.

## Project Structure

```
├── lib/
│   └── db.js              # PostgreSQL helpers (saveUser, saveGuilds)
├── pages/
│   ├── api/
│   │   ├── admin-auth.js  # Verify admin password
│   │   ├── get-token.js   # Fetch a user's access token (admin only)
│   │   ├── join.js        # Add a user to a Discord server
│   │   ├── refresh.js     # Refresh a Discord access token
│   │   ├── token.js       # Exchange OAuth code for tokens + save to DB
│   │   └── users.js       # List all saved users + guilds
│   ├── admin.js           # Password-protected admin dashboard
│   ├── guilds.js          # Shows logged-in user's servers
│   ├── index.js           # Login page (Login with Discord button)
│   ├── logout.js          # Clears session cookies
│   └── redirect.js        # OAuth2 callback handler
├── public/
│   └── oauth.js           # Client-side OAuth helpers (cookies, token exchange)
└── settings.js            # App config (clientID, redirect_uri)
```

## Environment Variables (Replit Secrets)

| Key                    | Description                        |
|------------------------|------------------------------------|
| DISCORD_CLIENT_ID      | Your Discord app's client ID       |
| DISCORD_CLIENT_SECRET  | Your Discord app's client secret   |
| DISCORD_BOT_TOKEN      | Your bot token                     |
| ADMIN_PASSWORD         | Password for /admin page           |
| DATABASE_URL           | PostgreSQL connection (auto-set)   |

## Pages

- `/` — Login with Discord
- `/guilds` — User's servers (after login)
- `/admin` — Admin dashboard (password protected)
- `/logout` — Log out

## OAuth2 Scopes

`identify` `email` `guilds` `guilds.join` `bot`
