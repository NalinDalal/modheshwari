(async () => {
  try {
    const base = 'http://localhost:3001/api';

    const loginRes = await fetch(`${base}/login/familyhead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nalin@demo.com', password: '123' }),
    });
    const loginJs = await loginRes.json().catch(() => null);
    console.log('LOGIN_RESP', JSON.stringify(loginJs));

    const token = (loginJs && loginJs.data && loginJs.data.token) || loginJs?.token || '';
    console.log('TOKEN', token);

    const meRes = await fetch(`${base}/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    console.log('/me status', meRes.status);
    console.log(await meRes.text());

    const eventsRes = await fetch(`${base}/events`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    console.log('/events status', eventsRes.status);
    console.log(await eventsRes.text());

    // Attempt to create an event WITHOUT token (should be unauthorized)
    const createNoAuth = await fetch(`${base}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Temp Event NoAuth', date: new Date().toISOString(), venue: 'Test Venue' }),
    });
    console.log('/events POST no-auth status', createNoAuth.status);
    console.log(await createNoAuth.text());

    // Attempt to create an event WITH token
    const createAuth = await fetch(`${base}/events`, {
      method: 'POST',
      headers: token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Temp Event Auth', date: new Date().toISOString(), venue: 'Auth Venue' }),
    });
    console.log('/events POST with-auth status', createAuth.status);
    console.log(await createAuth.text());
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
