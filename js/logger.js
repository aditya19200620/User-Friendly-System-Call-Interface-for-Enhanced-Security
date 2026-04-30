/* ── Audit Logging System ── */
const Logger = (() => {
  const logs = [];
  let listeners = [];
  let idCounter = 0;

  function createEntry(data) {
    const entry = {
      id: ++idCounter,
      timestamp: new Date(),
      user: data.user || 'system',
      role: data.role || 'system',
      syscall: data.syscall || '',
      category: data.category || '',
      params: data.params || [],
      status: data.status || 'info', // 'allowed', 'denied', 'info', 'error'
      severity: data.severity || 'INFO', // 'INFO', 'WARNING', 'CRITICAL'
      result: data.result || null,
      reason: data.reason || '',
      sessionId: data.sessionId || '',
    };
    logs.push(entry);
    listeners.forEach(fn => fn(entry));
    return entry;
  }

  function logAllowed(user, role, syscall, category, params, result, sessionId) {
    return createEntry({ user, role, syscall, category, params, status: 'allowed', severity: 'INFO', result, sessionId });
  }

  function logDenied(user, role, syscall, category, params, reason, sessionId) {
    const severity = role === 'guest' ? 'WARNING' : 'CRITICAL';
    return createEntry({ user, role, syscall, category, params, status: 'denied', severity, reason, sessionId });
  }

  function logSystem(message) {
    return createEntry({ syscall: message, status: 'info', severity: 'INFO', category: 'system' });
  }

  function logSecurity(user, message) {
    return createEntry({ user, syscall: message, status: 'denied', severity: 'CRITICAL', category: 'security' });
  }

  function getAll() { return [...logs]; }

  function getFiltered({ user, category, status, severity, search, limit } = {}) {
    let result = logs;
    if (user) result = result.filter(l => l.user === user);
    if (category) result = result.filter(l => l.category === category);
    if (status) result = result.filter(l => l.status === status);
    if (severity) result = result.filter(l => l.severity === severity);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        l.syscall.toLowerCase().includes(s) ||
        l.user.toLowerCase().includes(s) ||
        (l.reason && l.reason.toLowerCase().includes(s))
      );
    }
    if (limit) result = result.slice(-limit);
    return result;
  }

  function getStats() {
    const total = logs.length;
    const allowed = logs.filter(l => l.status === 'allowed').length;
    const denied = logs.filter(l => l.status === 'denied').length;
    const critical = logs.filter(l => l.severity === 'CRITICAL').length;
    const byCat = {};
    logs.forEach(l => { if (l.category) byCat[l.category] = (byCat[l.category] || 0) + 1; });
    const byUser = {};
    logs.forEach(l => { if (l.user && l.user !== 'system') byUser[l.user] = (byUser[l.user] || 0) + 1; });
    return { total, allowed, denied, critical, byCat, byUser };
  }

  function exportCSV() {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Syscall', 'Category', 'Status', 'Severity', 'Params', 'Reason'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp.toISOString(),
      l.user, l.role, l.syscall, l.category,
      l.status, l.severity,
      JSON.stringify(l.params),
      l.reason
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `syscall_audit_log_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clear() { logs.length = 0; idCounter = 0; }
  function onEntry(fn) { listeners.push(fn); }
  function removeListener(fn) { listeners = listeners.filter(l => l !== fn); }

  return { logAllowed, logDenied, logSystem, logSecurity, getAll, getFiltered, getStats, exportCSV, clear, onEntry, removeListener };
})();
