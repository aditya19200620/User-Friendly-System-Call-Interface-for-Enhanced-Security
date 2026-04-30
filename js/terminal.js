/* ── Interactive Terminal Component ── */
const Terminal = (() => {
  let bodyEl, inputEl, promptEl;
  let history = [], historyIdx = -1;
  let onCommandCallback = null;

  function init(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    bodyEl = container.querySelector('.terminal-body');
    inputEl = container.querySelector('.terminal-input');
    promptEl = container.querySelector('.terminal-prompt');

    inputEl.addEventListener('keydown', handleKey);
    updatePrompt();
    printWelcome();
  }

  function updatePrompt() {
    const user = Auth.getUser();
    const name = user ? user.username : 'anon';
    const symbol = (user && user.role === 'root') ? '#' : '$';
    if (promptEl) promptEl.textContent = `${name}@kernel ${symbol}`;
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      const cmd = inputEl.value.trim();
      inputEl.value = '';
      if (cmd) {
        history.push(cmd);
        historyIdx = history.length;
        printLine(`${promptEl.textContent} ${cmd}`, 'muted');
        processCommand(cmd);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (historyIdx > 0) { historyIdx--; inputEl.value = history[historyIdx]; }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (historyIdx < history.length - 1) { historyIdx++; inputEl.value = history[historyIdx]; }
      else { historyIdx = history.length; inputEl.value = ''; }
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocomplete(inputEl.value);
    }
  }

  function autocomplete(partial) {
    if (!partial) return;
    const allCmds = [...RBAC.getAllSyscallNames(), 'help', 'clear', 'whoami', 'logout', 'logs', 'history', 'permissions', 'users'];
    const matches = allCmds.filter(c => c.startsWith(partial.toLowerCase()));
    if (matches.length === 1) {
      inputEl.value = matches[0] + ' ';
    } else if (matches.length > 1) {
      printLine(matches.join('  '), 'info');
    }
  }

  function processCommand(raw) {
    Auth.resetTimeout();
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help': showHelp(args[0]); break;
      case 'clear': clearTerminal(); break;
      case 'whoami': showWhoami(); break;
      case 'logout': Auth.logout('user'); break;
      case 'history': showHistory(); break;
      case 'permissions': showPermissions(); break;
      case 'users': showUsers(); break;
      case 'logs': showRecentLogs(); break;
      default: executeSyscall(cmd, args);
    }

    if (onCommandCallback) onCommandCallback(cmd, args);
  }

  function executeSyscall(name, args) {
    const user = Auth.getUser();
    if (!user) { printLine('Error: Not authenticated', 'error'); return; }

    // Flash kernel transition
    triggerKernelFlash();

    const perm = RBAC.checkPermission(user.role, name);
    const def = SysCalls.getDefinition(name);

    if (!def) {
      printLine(`syscall: '${name}' not found. Type 'help' for available commands.`, 'error');
      return;
    }

    if (!perm.allowed) {
      printLine(`⛔ PERMISSION DENIED`, 'error');
      printLine(`   ${perm.reason}`, 'error');
      Logger.logDenied(user.username, user.role, name, perm.category || RBAC.getSyscallCategory(name), args, perm.reason, Auth.getSession().id);
      showDeniedModal(name, perm);
      return;
    }

    // Execute syscall
    const result = SysCalls.execute(name, args);
    printLine(`✓ ${name}() executed successfully  [${result.latency}]`, 'success');
    printLine(`  → ${JSON.stringify(result.result)}`, 'info');
    Logger.logAllowed(user.username, user.role, name, result.category, args, result.result, Auth.getSession().id);
  }

  function showHelp(topic) {
    if (topic) {
      const def = SysCalls.getDefinition(topic);
      if (def) {
        printLine(`━━ ${topic}() ━━`, 'system');
        printLine(`  Description: ${def.desc}`, '');
        printLine(`  Parameters:  ${def.params.length ? def.params.join(', ') : 'none'}`, '');
        printLine(`  Returns:     ${def.returns}`, '');
        printLine(`  Category:    ${def.cat}`, 'info');
      } else {
        printLine(`No help for '${topic}'`, 'warning');
      }
      return;
    }
    printLine('━━ SecureKernel Terminal ━━', 'system');
    printLine('');
    printLine('Built-in Commands:', 'info');
    printLine('  help [cmd]     Show help for a command');
    printLine('  clear          Clear terminal');
    printLine('  whoami         Show current user info');
    printLine('  permissions    Show your permissions');
    printLine('  users          List all users');
    printLine('  logs           Show recent audit logs');
    printLine('  history        Show command history');
    printLine('  logout         Log out');
    printLine('');
    printLine('System Calls (use Tab for autocomplete):', 'info');
    const cats = RBAC.getSyscallsByCategory();
    for (const [cat, calls] of Object.entries(cats)) {
      const meta = SysCalls.CATEGORIES[cat];
      printLine(`  ${meta.icon} ${meta.label}: ${calls.map(c => c.name).join(', ')}`, '');
    }
    printLine('');
    printLine('Usage: <syscall> [param1] [param2] ...', 'muted');
  }

  function showWhoami() {
    const u = Auth.getUser();
    const s = Auth.getSession();
    printLine(`User:    ${u.username} (${u.fullName})`, 'info');
    printLine(`Role:    ${u.role}`, 'info');
    printLine(`Session: ${s.id.slice(0, 8)}...`, 'muted');
    printLine(`Uptime:  ${Math.round(Auth.getSessionAge() / 1000)}s`, 'muted');
  }

  function showPermissions() {
    const role = Auth.getRole();
    const perms = RBAC.getRolePermissions(role);
    printLine(`Permissions for '${role}':`, 'system');
    for (const [cat, level] of Object.entries(perms)) {
      const icon = level === 'full' ? '✅' : level === 'none' ? '❌' : '⚠️';
      printLine(`  ${icon} ${cat}: ${level}`, '');
    }
  }

  function showUsers() {
    Auth.getAllUsers().forEach(u => {
      printLine(`  ${u.username.padEnd(10)} ${u.role.padEnd(8)} ${u.fullName}`, '');
    });
  }

  function showRecentLogs() {
    const recent = Logger.getFiltered({ limit: 10 });
    if (!recent.length) { printLine('No logs yet.', 'muted'); return; }
    recent.forEach(l => {
      const ts = l.timestamp.toLocaleTimeString();
      const cls = l.status === 'denied' ? 'error' : l.status === 'allowed' ? 'success' : '';
      printLine(`[${ts}] ${l.user} ${l.syscall} → ${l.status.toUpperCase()}`, cls);
    });
  }

  function showHistory() {
    history.forEach((cmd, i) => printLine(`  ${i + 1}  ${cmd}`, ''));
  }

  function printLine(text, cls) {
    if (!bodyEl) return;
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    bodyEl.appendChild(div);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function printWelcome() {
    printLine('╔══════════════════════════════════════════════╗', 'system');
    printLine('║     SecureKernel v2.0 — System Call Shell    ║', 'system');
    printLine('║  Type "help" for commands, Tab to autocomplete║', 'system');
    printLine('╚══════════════════════════════════════════════╝', 'system');
    printLine('');
  }

  function clearTerminal() {
    if (bodyEl) bodyEl.innerHTML = '';
  }

  function triggerKernelFlash() {
    const flash = document.getElementById('kernel-flash');
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 500);
    }
  }

  function showDeniedModal(syscall, perm) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('permission-modal');
    if (!overlay || !modal) return;
    modal.querySelector('.modal-syscall').textContent = syscall;
    modal.querySelector('.modal-reason').textContent = perm.reason;
    overlay.classList.add('show');
  }

  function focus() { if (inputEl) inputEl.focus(); }
  function onCommand(fn) { onCommandCallback = fn; }

  return { init, updatePrompt, printLine, clearTerminal, focus, onCommand };
})();
