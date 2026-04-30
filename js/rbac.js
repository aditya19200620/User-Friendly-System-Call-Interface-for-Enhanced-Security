/* ── Role-Based Access Control Engine ── */
const RBAC = (() => {
  // Permission matrix: role → allowed syscall categories
  const PERMISSIONS = {
    root: {
      file: 'full', process: 'full', memory: 'full',
      network: 'full', device: 'full', security: 'full'
    },
    admin: {
      file: 'full', process: 'full', memory: 'full',
      network: 'full', device: 'read', security: 'none'
    },
    user: {
      file: 'readwrite', process: 'limited', memory: 'read',
      network: 'limited', device: 'none', security: 'none'
    },
    guest: {
      file: 'read', process: 'read', memory: 'read',
      network: 'none', device: 'none', security: 'none'
    }
  };

  // Syscall → required permission level
  const SYSCALL_REQUIREMENTS = {
    // File I/O
    open: { category: 'file', level: 'read' },
    read: { category: 'file', level: 'read' },
    write: { category: 'file', level: 'readwrite' },
    close: { category: 'file', level: 'read' },
    stat: { category: 'file', level: 'read' },
    mkdir: { category: 'file', level: 'readwrite' },
    rmdir: { category: 'file', level: 'full' },
    unlink: { category: 'file', level: 'full' },
    chmod: { category: 'file', level: 'full' },
    chown: { category: 'file', level: 'full' },
    // Process
    fork: { category: 'process', level: 'limited' },
    exec: { category: 'process', level: 'limited' },
    wait: { category: 'process', level: 'read' },
    exit: { category: 'process', level: 'read' },
    kill: { category: 'process', level: 'full' },
    getpid: { category: 'process', level: 'read' },
    getppid: { category: 'process', level: 'read' },
    nice: { category: 'process', level: 'full' },
    // Memory
    mmap: { category: 'memory', level: 'full' },
    munmap: { category: 'memory', level: 'full' },
    brk: { category: 'memory', level: 'limited' },
    mprotect: { category: 'memory', level: 'full' },
    mlock: { category: 'memory', level: 'full' },
    meminfo: { category: 'memory', level: 'read' },
    // Network
    socket: { category: 'network', level: 'limited' },
    bind: { category: 'network', level: 'full' },
    listen: { category: 'network', level: 'full' },
    accept: { category: 'network', level: 'full' },
    connect: { category: 'network', level: 'limited' },
    send: { category: 'network', level: 'limited' },
    recv: { category: 'network', level: 'limited' },
    // Device
    ioctl: { category: 'device', level: 'full' },
    dev_read: { category: 'device', level: 'read' },
    dev_write: { category: 'device', level: 'full' },
    // Security
    setuid: { category: 'security', level: 'full' },
    setgid: { category: 'security', level: 'full' },
    chroot: { category: 'security', level: 'full' },
    capset: { category: 'security', level: 'full' },
  };

  const LEVEL_HIERARCHY = ['none', 'read', 'limited', 'readwrite', 'full'];

  function levelValue(l) { return LEVEL_HIERARCHY.indexOf(l); }

  function checkPermission(role, syscallName) {
    const req = SYSCALL_REQUIREMENTS[syscallName];
    if (!req) return { allowed: false, reason: `Unknown syscall: ${syscallName}` };
    const perms = PERMISSIONS[role];
    if (!perms) return { allowed: false, reason: `Unknown role: ${role}` };
    const userLevel = perms[req.category];
    const needed = req.level;
    if (levelValue(userLevel) >= levelValue(needed)) {
      return { allowed: true, category: req.category, level: userLevel };
    }
    return {
      allowed: false,
      reason: `Role '${role}' has '${userLevel}' access to '${req.category}', but '${syscallName}' requires '${needed}'`,
      category: req.category,
      required: needed,
      actual: userLevel,
    };
  }

  function getRolePermissions(role) {
    return PERMISSIONS[role] || {};
  }

  function getSyscallCategory(name) {
    const req = SYSCALL_REQUIREMENTS[name];
    return req ? req.category : null;
  }

  function getAllSyscallNames() {
    return Object.keys(SYSCALL_REQUIREMENTS);
  }

  function getSyscallsByCategory() {
    const cats = {};
    for (const [name, req] of Object.entries(SYSCALL_REQUIREMENTS)) {
      if (!cats[req.category]) cats[req.category] = [];
      cats[req.category].push({ name, ...req });
    }
    return cats;
  }

  function getPermissionMatrix() {
    return JSON.parse(JSON.stringify(PERMISSIONS));
  }

  return { checkPermission, getRolePermissions, getSyscallCategory, getAllSyscallNames, getSyscallsByCategory, getPermissionMatrix, LEVEL_HIERARCHY };
})();
