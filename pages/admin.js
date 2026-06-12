import { useEffect, useState } from 'react';

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('users');
  const [joinResult, setJoinResult] = useState('');
  const [guildId, setGuildId] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [tokenMap, setTokenMap] = useState({});

  const handleLogin = async () => {
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setAuthError('');
      sessionStorage.setItem('adminPass', password);
    } else {
      setAuthError('Wrong password');
    }
  };

  useEffect(() => {
    if (!authed) return;
    fetch('/api/users').then(r => r.json()).then(setData);
  }, [authed]);

  const handleJoin = async () => {
    if (!selectedUser || !guildId) return alert('Select a user and enter a guild ID');
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discord_id: selectedUser, guild_id: guildId }),
    });
    const result = await res.json();
    setJoinResult(res.ok ? `✅ ${result.message}` : `❌ ${result.error?.message || result.error}`);
  };

  const handleShowToken = async (discord_id) => {
    if (tokenMap[discord_id]) { setTokenMap(prev => ({ ...prev, [discord_id]: null })); return; }
    const pass = sessionStorage.getItem('adminPass');
    const res = await fetch('/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass, discord_id }),
    });
    const result = await res.json();
    if (res.ok) setTokenMap(prev => ({ ...prev, [discord_id]: result.access_token }));
  };

  const copyToken = (token) => navigator.clipboard.writeText(token);

  const verifiedUsers = data?.users?.filter(u => u.verified_at) || [];
  const allUsers = data?.users || [];

  if (!authed) {
    return (
      <div style={s.loginWrap}>
        <div style={s.loginBox}>
          <h2 style={s.loginTitle}>🔒 Admin Access</h2>
          <input style={s.input} type="password" placeholder="Enter admin password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {authError && <p style={s.error}>{authError}</p>}
          <button style={s.btn} onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  if (!data) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Admin Panel</h1>

      <div style={s.tabs}>
        {['users', 'verified', 'add-to-server'].map(t => (
          <button key={t} style={tab === t ? s.tabActive : s.tab} onClick={() => setTab(t)}>
            {t === 'users' && `👥 All Users (${allUsers.length})`}
            {t === 'verified' && `✅ Verified (${verifiedUsers.length})`}
            {t === 'add-to-server' && '➕ Add to Server'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <table style={s.table}>
          <thead><tr>
            {['Avatar', 'Username', 'Discord ID', 'Email', 'Servers', 'Access Token', 'Joined'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {allUsers.map(u => (
              <tr key={u.discord_id}>
                <td style={s.td}>{u.avatar ? <img src={`https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png?size=32`} style={s.avatar} /> : '—'}</td>
                <td style={s.td}>{u.username}{u.discriminator && u.discriminator !== '0' ? `#${u.discriminator}` : ''}</td>
                <td style={s.td}><code style={s.code}>{u.discord_id}</code></td>
                <td style={s.td}>{u.email || '—'}</td>
                <td style={s.td}>{u.guilds.length}</td>
                <td style={s.td}>
                  {tokenMap[u.discord_id] ? (
                    <div style={s.tokenRow}>
                      <code style={s.tokenCode}>{tokenMap[u.discord_id].slice(0, 16)}…</code>
                      <button style={s.smallBtn} onClick={() => copyToken(tokenMap[u.discord_id])}>Copy</button>
                      <button style={s.smallBtnGrey} onClick={() => handleShowToken(u.discord_id)}>Hide</button>
                    </div>
                  ) : (
                    <button style={s.smallBtn} onClick={() => handleShowToken(u.discord_id)}>Show</button>
                  )}
                </td>
                <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'verified' && (
        <table style={s.table}>
          <thead><tr>
            {['Avatar', 'Username', 'Discord ID', 'Email', 'Guild ID', 'Role ID', 'Verified At'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {verifiedUsers.length === 0 ? (
              <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#888' }}>No verified users yet. Set up /setup-verify in your Discord server first.</td></tr>
            ) : verifiedUsers.map(u => (
              <tr key={u.discord_id}>
                <td style={s.td}>{u.avatar ? <img src={`https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png?size=32`} style={s.avatar} /> : '—'}</td>
                <td style={s.td}>{u.username}</td>
                <td style={s.td}><code style={s.code}>{u.discord_id}</code></td>
                <td style={s.td}>{u.email || '—'}</td>
                <td style={s.td}><code style={s.code}>{u.verified_guild_id}</code></td>
                <td style={s.td}><code style={s.code}>{u.verified_role_id}</code></td>
                <td style={s.td}>{new Date(u.verified_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'add-to-server' && (
        <div style={s.card}>
          <h2 style={s.subtitle}>➕ Add User to Any Server</h2>
          <select style={s.input} onChange={e => setSelectedUser(e.target.value)} defaultValue="">
            <option value="" disabled>Select a user</option>
            {allUsers.map(u => (
              <option key={u.discord_id} value={u.discord_id}>{u.username} ({u.discord_id})</option>
            ))}
          </select>
          <input style={s.input} placeholder="Server (Guild) ID" value={guildId} onChange={e => setGuildId(e.target.value)} />
          <button style={s.btn} onClick={handleJoin}>Add to Server</button>
          {joinResult && <p style={s.result}>{joinResult}</p>}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { fontFamily: 'sans-serif', padding: '24px', maxWidth: '1100px', margin: '0 auto' },
  title: { fontSize: '24px', marginBottom: '16px' },
  subtitle: { fontSize: '18px', marginBottom: '12px' },
  loading: { padding: '40px', textAlign: 'center' },
  loginWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5' },
  loginBox: { background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '320px' },
  loginTitle: { marginBottom: '16px', textAlign: 'center' },
  error: { color: 'red', marginBottom: '8px', fontSize: '14px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: { padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  tabActive: { padding: '8px 16px', background: '#5865F2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  card: { background: '#f0f0f0', padding: '16px', borderRadius: '8px', maxWidth: '500px' },
  input: { display: 'block', width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btn: { padding: '8px 20px', background: '#5865F2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' },
  smallBtn: { padding: '3px 10px', background: '#5865F2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '4px' },
  smallBtnGrey: { padding: '3px 10px', background: '#888', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  result: { marginTop: '8px', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px', background: '#5865F2', color: '#fff' },
  td: { padding: '10px', borderBottom: '1px solid #eee', verticalAlign: 'middle' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%' },
  code: { background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' },
  tokenRow: { display: 'flex', alignItems: 'center', gap: '4px' },
  tokenCode: { background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' },
};
