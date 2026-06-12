const clientID = process.env.DISCORD_CLIENT_ID || '1473394152023654430';
const redirect_uri = encodeURIComponent(
  process.env.REDIRECT_URI || 'https://discord-oauth-2-nextjs-app--ABGAMING6.replit.app/redirect'
);

export {
  clientID,
  redirect_uri
};
