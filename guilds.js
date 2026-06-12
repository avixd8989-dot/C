import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getTokensForBrowser, deleteTokens } from '../public/oauth';

export default function Guilds() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const { token } = getTokensForBrowser();
    
    if (!token) {
      router.push('/');
      return;
    }

    // Get user info
    fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setUser);

    // Get user guilds
    fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setGuilds);
  }, []);

  const logout = () => {
    deleteTokens();
    router.push('/');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome {user.username}</h1>
      <h2>Your Servers:</h2>
      {guilds.map(g => (
        <div key={g.id}>
          {g.name} {g.owner && '(Owner)'}
        </div>
      ))}
      <button onClick={logout}>Logout</button>
    </div>
  );
}