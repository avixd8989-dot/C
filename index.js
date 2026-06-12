import { clientID, redirect_uri } from '../settings';

export default function Home() {
  const scopes = [
    'identify',
    'email',
    'guilds',
    'guilds.join',
  ].join('%20');

  const loginUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&redirect_uri=${redirect_uri}&response_type=code&scope=${scopes}`;

  return (
    <div>
      <h1>Discord OAuth2 App</h1>
      <a href={loginUrl}>
        <button>Login with Discord</button>
      </a>
    </div>
  );
}
