/* ── Application Orchestrator ── */
const App = (() => {
  let currentSection = 'overview';

  function init() {
    setupLoginForm();
    Auth.onLogin(onLogin);
    Auth.onLogout(onLogout);
  }

  function setupLoginForm() {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const result = Auth.login(username, password);
      if (result.success) {
        errorEl.textContent = '';
      } else {
        errorEl.textContent = result.error;
        errorEl.style.animation = 'none';
        errorEl.offsetHeight; // reflow
        errorEl.style.animation = 'fadeIn 0.3s';
      }
    });
  }

  function onLogin(session) {
    const loginScreen = document.getElementById('login-screen');
    const app = document.getElementById('app');
    loginScreen.classList.add('hidden');
    app.classList.add('active');

    // Update UI
    updateUserPanel(session.user);
    Terminal.init('#terminal-container');
    Terminal.updatePrompt();
    Dashboard.init();
    Dashboard.renderSyscallReference();
    setupNavigation();
    setupLogControls();
    setupModal();
    navigateTo('overview');

    Logger.logSystem(`User '${session.user.username}' logged in (role: ${session.user.role})`);

    // Start chart refresh interval
    setInterval(() => {
      if (currentSection === 'analytics') Dashboard.drawCharts();
    }, 3000);
  }

  function onLogout(reason, session) {
    const loginScreen = document.getElementById('login-screen');
    const app = document.getElementById('app');
    loginScreen.classList.remove('hidden');
    app.classList.remove('active');
    document.getElementById('login-password').value = '';

    if (reason === 'timeout') {
      document.getElementById('login-error').textContent = 'Session expired. Please log in again.';
    }

    if (session) Logger.logSystem(`User '${session.user.username}' logged out (${reason})`);
  }

  function updateUserPanel(user) {
    const avatar = document.querySelector('.user-avatar');
    const nameEl = document.querySelector('.user-info .name');
    const roleEl = document.querySelector('.user-info .role');
    if (avatar) avatar.textContent = user.username[0].toUpperCase();
    if (nameEl) nameEl.textContent = user.fullName;
    if (roleEl) roleEl.textContent = user.role;

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout('user'));
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', () => navigateTo(item.dataset.section));
    });
  }

  function navigateTo(section) {
    currentSection = section;

    // Update nav
    document.querySelectorAll('.nav-item[data-section]').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section);
    });

    // Show section
    document.querySelectorAll('.section').forEach(el => {
      el.classList.toggle('active', el.id === 'section-' + section);
    });

    // Section-specific init
    if (section === 'terminal') Terminal.focus();
    if (section === 'analytics') Dashboard.drawCharts();
    if (section === 'logs') Dashboard.renderLogsTable({});
    if (section === 'reference') Dashboard.renderSyscallReference();
    if (section === 'overview') Dashboard.updateStats();
  }

  function setupLogControls() {
    const applyBtn = document.getElementById('log-apply-filters');
    const exportBtn = document.getElementById('log-export');
    const clearBtn = document.getElementById('log-clear');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const filters = {
          user: document.getElementById('log-filter-user').value || undefined,
          category: document.getElementById('log-filter-category').value || undefined,
          status: document.getElementById('log-filter-status').value || undefined,
          severity: document.getElementById('log-filter-severity').value || undefined,
          search: document.getElementById('log-search').value || undefined,
        };
        Dashboard.renderLogsTable(filters);
      });
    }
    if (exportBtn) exportBtn.addEventListener('click', () => Logger.exportCSV());
    if (clearBtn) clearBtn.addEventListener('click', () => {
      Logger.clear();
      Dashboard.renderLogsTable({});
      Dashboard.updateStats();
    });
  }

  function setupModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('show'); });
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
  }

  return { init, navigateTo };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
