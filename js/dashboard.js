/* ── Dashboard & Analytics ── */
const Dashboard = (() => {
  let statsEls = {};
  let activityFeed = null;
  let chartsDrawn = false;

  function init() {
    statsEls = {
      totalCalls: document.getElementById('stat-total'),
      allowed: document.getElementById('stat-allowed'),
      denied: document.getElementById('stat-denied'),
      threats: document.getElementById('stat-threats'),
    };
    activityFeed = document.getElementById('activity-feed');

    Logger.onEntry(entry => {
      updateStats();
      addActivityItem(entry);
    });
  }

  function updateStats() {
    const s = Logger.getStats();
    if (statsEls.totalCalls) statsEls.totalCalls.textContent = s.total;
    if (statsEls.allowed) statsEls.allowed.textContent = s.allowed;
    if (statsEls.denied) statsEls.denied.textContent = s.denied;
    if (statsEls.threats) statsEls.threats.textContent = s.critical;
  }

  function addActivityItem(entry) {
    if (!activityFeed) return;
    const div = document.createElement('div');
    div.className = 'activity-item';
    const ts = entry.timestamp.toLocaleTimeString();
    const statusCls = entry.status === 'denied' ? 'status-denied' : entry.status === 'allowed' ? 'status-allowed' : '';
    div.innerHTML = `
      <span class="activity-time">${ts}</span>
      <span class="activity-user">${entry.user}</span>
      <span class="activity-call">${entry.syscall}</span>
      <span class="activity-status ${statusCls}">${entry.status.toUpperCase()}</span>
    `;
    activityFeed.prepend(div);
    // Keep max 50 items
    while (activityFeed.children.length > 50) activityFeed.lastChild.remove();
  }

  /* ── Canvas Charts ── */
  function drawCharts() {
    drawCategoryChart();
    drawStatusChart();
    drawTimelineChart();
    drawUserChart();
    chartsDrawn = true;
  }

  function drawCategoryChart() {
    const canvas = document.getElementById('chart-categories');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 260;
    ctx.clearRect(0, 0, w, h);

    const stats = Logger.getStats();
    const cats = SysCalls.getCategories();
    const entries = Object.entries(stats.byCat);
    if (!entries.length) { drawNoData(ctx, w, h); return; }

    const maxVal = Math.max(...entries.map(e => e[1]), 1);
    const barW = Math.min(60, (w - 80) / entries.length - 10);
    const chartH = h - 60;
    const startX = (w - entries.length * (barW + 10)) / 2;

    entries.forEach(([cat, count], i) => {
      const x = startX + i * (barW + 10);
      const barH = (count / maxVal) * chartH;
      const y = h - 30 - barH;
      const color = cats[cat] ? cats[cat].color : '#666';

      // Bar with gradient
      const grad = ctx.createLinearGradient(x, y, x, h - 30);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '33');
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, barW, barH, 4);
      ctx.fill();

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cat, x + barW / 2, h - 12);

      // Value
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(count, x + barW / 2, y - 8);
    });
  }

  function drawStatusChart() {
    const canvas = document.getElementById('chart-status');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 260;
    ctx.clearRect(0, 0, w, h);

    const stats = Logger.getStats();
    const data = [
      { label: 'Allowed', value: stats.allowed, color: '#10b981' },
      { label: 'Denied', value: stats.denied, color: '#ef4444' },
    ];
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) { drawNoData(ctx, w, h); return; }

    const cx = w / 2, cy = h / 2 - 10, r = 80, innerR = 50;
    let angle = -Math.PI / 2;

    data.forEach(d => {
      const slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.arc(cx, cy, innerR, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      angle += slice;
    });

    // Center text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 4);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('total calls', cx, cy + 22);

    // Legend
    data.forEach((d, i) => {
      const lx = w / 2 - 60 + i * 120;
      const ly = h - 25;
      ctx.fillStyle = d.color;
      ctx.fillRect(lx, ly, 10, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${d.label} (${d.value})`, lx + 14, ly + 9);
    });
  }

  function drawTimelineChart() {
    const canvas = document.getElementById('chart-timeline');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 260;
    ctx.clearRect(0, 0, w, h);

    const logs = Logger.getAll();
    if (logs.length < 2) { drawNoData(ctx, w, h); return; }

    // Group by 10-second buckets
    const buckets = {};
    const now = Date.now();
    const window = 5 * 60 * 1000; // last 5 min
    logs.filter(l => now - l.timestamp.getTime() < window).forEach(l => {
      const key = Math.floor(l.timestamp.getTime() / 10000) * 10000;
      if (!buckets[key]) buckets[key] = { allowed: 0, denied: 0 };
      if (l.status === 'allowed') buckets[key].allowed++;
      else if (l.status === 'denied') buckets[key].denied++;
    });

    const keys = Object.keys(buckets).map(Number).sort();
    if (!keys.length) { drawNoData(ctx, w, h); return; }

    const maxVal = Math.max(...keys.map(k => buckets[k].allowed + buckets[k].denied), 1);
    const chartH = h - 50;
    const step = (w - 60) / Math.max(keys.length - 1, 1);

    // Draw allowed line
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    keys.forEach((k, i) => {
      const x = 40 + i * step;
      const y = h - 30 - (buckets[k].allowed / maxVal) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw denied line
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    keys.forEach((k, i) => {
      const x = 40 + i * step;
      const y = h - 30 - (buckets[k].denied / maxVal) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Axis
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 10); ctx.lineTo(40, h - 30); ctx.lineTo(w - 20, h - 30);
    ctx.stroke();

    // Legend
    [{ label: 'Allowed', color: '#10b981' }, { label: 'Denied', color: '#ef4444' }].forEach((d, i) => {
      ctx.fillStyle = d.color;
      ctx.fillRect(w / 2 - 80 + i * 100, h - 15, 10, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(d.label, w / 2 - 66 + i * 100, h - 6);
    });
  }

  function drawUserChart() {
    const canvas = document.getElementById('chart-users');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 260;
    ctx.clearRect(0, 0, w, h);

    const stats = Logger.getStats();
    const entries = Object.entries(stats.byUser);
    if (!entries.length) { drawNoData(ctx, w, h); return; }

    const colors = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];
    const maxVal = Math.max(...entries.map(e => e[1]), 1);
    const barH = 28;
    const startY = 30;

    entries.forEach(([user, count], i) => {
      const y = startY + i * (barH + 12);
      const barW = (count / maxVal) * (w - 140);

      const grad = ctx.createLinearGradient(80, y, 80 + barW, y);
      grad.addColorStop(0, colors[i % colors.length]);
      grad.addColorStop(1, colors[i % colors.length] + '44');
      ctx.fillStyle = grad;
      roundRect(ctx, 80, y, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(user, 70, y + barH / 2 + 4);

      ctx.textAlign = 'left';
      ctx.fillText(count, 88 + barW, y + barH / 2 + 4);
    });
  }

  function drawNoData(ctx, w, h) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet — execute some syscalls!', w / 2, h / 2);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── Logs Table ── */
  function renderLogsTable(filters) {
    const tbody = document.getElementById('logs-tbody');
    if (!tbody) return;
    const logs = Logger.getFiltered(filters);
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td class="mono">${l.id}</td>
        <td class="mono">${l.timestamp.toLocaleTimeString()}</td>
        <td>${l.user}</td>
        <td>${l.role}</td>
        <td class="mono">${l.syscall}</td>
        <td>${l.category}</td>
        <td class="${l.status === 'allowed' ? 'status-allowed' : l.status === 'denied' ? 'status-denied' : ''}">${l.status.toUpperCase()}</td>
        <td class="severity-${l.severity.toLowerCase()}">${l.severity}</td>
        <td>${l.reason || '—'}</td>
      </tr>
    `).join('');
  }

  /* ── Syscall Reference ── */
  function renderSyscallReference() {
    const container = document.getElementById('ref-container');
    if (!container) return;
    const role = Auth.getRole();
    const cats = RBAC.getSyscallsByCategory();
    const catMeta = SysCalls.getCategories();

    container.innerHTML = Object.entries(cats).map(([cat, calls]) => {
      const meta = catMeta[cat];
      return `
        <div class="card">
          <div class="ref-category-title">${meta.icon} ${meta.label}</div>
          <table class="ref-table">
            <thead><tr><th>Syscall</th><th>Description</th><th>Access</th></tr></thead>
            <tbody>
              ${calls.map(c => {
                const perm = RBAC.checkPermission(role, c.name);
                const badge = perm.allowed ? '<span class="badge allowed">Allowed</span>' : '<span class="badge denied">Denied</span>';
                return `<tr><td>${c.name}()</td><td>${SysCalls.getDefinition(c.name).desc}</td><td>${badge}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  }

  return { init, updateStats, drawCharts, renderLogsTable, renderSyscallReference };
})();
