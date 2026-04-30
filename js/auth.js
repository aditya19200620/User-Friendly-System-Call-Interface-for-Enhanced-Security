/* ── Authentication & Session Management ── */
const Auth = (() => {
  const USERS = [
    { id: 'root', username: 'root', password: 'toor', role: 'root', fullName: 'Root User' },
    { id: 'admin', username: 'admin', password: 'admin123', role: 'admin', fullName: 'System Admin' },
    { id: 'user', username: 'user', password: 'user123', role: 'user', fullName: 'Standard User' },
    { id: 'guest', username: 'guest', password: 'guest', role: 'guest', fullName: 'Guest Account' },
  ];

  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min
  let currentSession = null;
  let timeoutTimer = null;
  let onLoginCallback = null;
  let onLogoutCallback = null;

  function hashPassword(pw) {
    let h = 0;
    for (let i = 0; i < pw.length; i++) h = ((h << 5) - h + pw.charCodeAt(i)) | 0;
    return 'sha256$' + Math.abs(h).toString(16).padStart(8, '0');
  }

  function login(username, password) {
    const user = USERS.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, error: 'Invalid username or password' };
    currentSession = {
      user: { ...user, passwordHash: hashPassword(user.password) },
      loginTime: Date.now(),
      lastActivity: Date.now(),
      id: crypto.randomUUID ? crypto.randomUUID() : 'sess-' + Date.now(),
    };
    delete currentSession.user.password;
    resetTimeout();
    if (onLoginCallback) onLoginCallback(currentSession);
    return { success: true, session: currentSession };
  }

  function logout(reason) {
    const sess = currentSession;
    currentSession = null;
    clearTimeout(timeoutTimer);
    if (onLogoutCallback) onLogoutCallback(reason || 'manual', sess);
  }

  function resetTimeout() {
    clearTimeout(timeoutTimer);
    if (currentSession) {
      currentSession.lastActivity = Date.now();
      timeoutTimer = setTimeout(() => logout('timeout'), SESSION_TIMEOUT);
    }
  }

  function getSession() { return currentSession; }
  function getUser() { return currentSession ? currentSession.user : null; }
  function isLoggedIn() { return currentSession !== null; }
  function getRole() { return currentSession ? currentSession.user.role : null; }
  function getSessionAge() {
    if (!currentSession) return 0;
    return Date.now() - currentSession.loginTime;
  }

  function onLogin(cb) { onLoginCallback = cb; }
  function onLogout(cb) { onLogoutCallback = cb; }

  function getAllUsers() {
    return USERS.map(u => ({ username: u.username, role: u.role, fullName: u.fullName }));
  }

  return { login, logout, getSession, getUser, isLoggedIn, getRole, getSessionAge, resetTimeout, onLogin, onLogout, getAllUsers };
})();
