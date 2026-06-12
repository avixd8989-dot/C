import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { clientID, redirect_uri } from '../settings';

export default function Verify() {
  const router = useRouter();
  const { guild, role } = router.query;

  useEffect(() => {
    if (!guild || !role) return;

    const state = encodeURIComponent(`${guild}:${role}`);
    const scopes = ['identify', 'email', 'guilds', 'guilds.join'].join('%20');
    const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&redirect_uri=${redirect_uri}&response_type=code&scope=${scopes}&state=${state}`;

    window.location.href = oauthUrl;
  }, [guild, role]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#36393f', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h2>Redirecting to Discord...</h2>
        <p style={{ color: '#b9bbbe' }}>You will be asked to authorize. After that you will get your role automatically.</p>
      </div>
    </div>
  );
}
