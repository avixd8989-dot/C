import Cookie from 'js-cookie';

async function exchangeToken(code, state) {
  const res = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function refreshToken(refreshToken) {
  const res = await fetch('/api/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return null;
  return res.json();
}

function saveTokens(token, refreshToken) {
  Cookie.set('token', token);
  Cookie.set('refreshToken', refreshToken);
}

function deleteTokens() {
  Cookie.remove('token');
  Cookie.remove('refreshToken');
}

function getTokensForBrowser() {
  let token = Cookie.getJSON('token');
  let refreshToken = Cookie.getJSON('refreshToken');
  return { token, refreshToken };
}

function getTokensForServer(req) {
  if (req.headers.cookie) {
    const cookieToken = req.headers.cookie.split(';').find(c => c.trim().startsWith('token='));
    const cookieRefreshToken = req.headers.cookie.split(';').find(c => c.trim().startsWith('refreshToken='));
    if (!cookieToken || !cookieRefreshToken) return {};
    return {
      token: cookieToken.split('=')[1],
      refreshToken: cookieRefreshToken.split('=')[1],
    };
  }
  return {};
}

export {
  exchangeToken,
  refreshToken,
  saveTokens,
  deleteTokens,
  getTokensForBrowser,
  getTokensForServer,
};
