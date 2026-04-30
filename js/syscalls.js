/* ── System Call Definitions & Execution Simulation ── */
const SysCalls = (() => {
  const CATEGORIES = {
    file: { icon: '📁', label: 'File I/O', color: '#06b6d4' },
    process: { icon: '⚙️', label: 'Process Management', color: '#8b5cf6' },
    memory: { icon: '🧠', label: 'Memory Management', color: '#10b981' },
    network: { icon: '🌐', label: 'Network', color: '#3b82f6' },
    device: { icon: '🔌', label: 'Device Control', color: '#f59e0b' },
    security: { icon: '🔒', label: 'Security', color: '#ef4444' },
  };

  const DEFINITIONS = {
    // ── File I/O ──
    open:   { cat: 'file', desc: 'Open a file descriptor', params: ['path','flags'], returns: 'fd (int)' },
    read:   { cat: 'file', desc: 'Read bytes from file descriptor', params: ['fd','count'], returns: 'bytes_read (int)' },
    write:  { cat: 'file', desc: 'Write bytes to file descriptor', params: ['fd','data'], returns: 'bytes_written (int)' },
    close:  { cat: 'file', desc: 'Close a file descriptor', params: ['fd'], returns: '0 on success' },
    stat:   { cat: 'file', desc: 'Get file status information', params: ['path'], returns: 'stat struct' },
    mkdir:  { cat: 'file', desc: 'Create a directory', params: ['path','mode'], returns: '0 on success' },
    rmdir:  { cat: 'file', desc: 'Remove a directory', params: ['path'], returns: '0 on success' },
    unlink: { cat: 'file', desc: 'Delete a file', params: ['path'], returns: '0 on success' },
    chmod:  { cat: 'file', desc: 'Change file permissions', params: ['path','mode'], returns: '0 on success' },
    chown:  { cat: 'file', desc: 'Change file ownership', params: ['path','uid','gid'], returns: '0 on success' },

    // ── Process ──
    fork:    { cat: 'process', desc: 'Create a child process', params: [], returns: 'pid (int)' },
    exec:    { cat: 'process', desc: 'Execute a program', params: ['path','args'], returns: 'no return on success' },
    wait:    { cat: 'process', desc: 'Wait for child process', params: ['pid'], returns: 'exit status' },
    exit:    { cat: 'process', desc: 'Terminate calling process', params: ['status'], returns: 'no return' },
    kill:    { cat: 'process', desc: 'Send signal to process', params: ['pid','signal'], returns: '0 on success' },
    getpid:  { cat: 'process', desc: 'Get process ID', params: [], returns: 'pid (int)' },
    getppid: { cat: 'process', desc: 'Get parent process ID', params: [], returns: 'ppid (int)' },
    nice:    { cat: 'process', desc: 'Change process priority', params: ['increment'], returns: 'new priority' },

    // ── Memory ──
    mmap:     { cat: 'memory', desc: 'Map memory region', params: ['addr','length','prot'], returns: 'mapped address' },
    munmap:   { cat: 'memory', desc: 'Unmap memory region', params: ['addr','length'], returns: '0 on success' },
    brk:      { cat: 'memory', desc: 'Change data segment size', params: ['addr'], returns: 'new break address' },
    mprotect: { cat: 'memory', desc: 'Set memory protection', params: ['addr','length','prot'], returns: '0 on success' },
    mlock:    { cat: 'memory', desc: 'Lock pages in memory', params: ['addr','length'], returns: '0 on success' },
    meminfo:  { cat: 'memory', desc: 'Get memory information', params: [], returns: 'memory stats' },

    // ── Network ──
    socket:  { cat: 'network', desc: 'Create a network socket', params: ['domain','type'], returns: 'sockfd (int)' },
    bind:    { cat: 'network', desc: 'Bind socket to address', params: ['sockfd','addr','port'], returns: '0 on success' },
    listen:  { cat: 'network', desc: 'Listen for connections', params: ['sockfd','backlog'], returns: '0 on success' },
    accept:  { cat: 'network', desc: 'Accept a connection', params: ['sockfd'], returns: 'new sockfd' },
    connect: { cat: 'network', desc: 'Connect to remote host', params: ['sockfd','addr','port'], returns: '0 on success' },
    send:    { cat: 'network', desc: 'Send data on socket', params: ['sockfd','data'], returns: 'bytes_sent' },
    recv:    { cat: 'network', desc: 'Receive data from socket', params: ['sockfd','bufsize'], returns: 'bytes_received' },

    // ── Device ──
    ioctl:     { cat: 'device', desc: 'Device I/O control', params: ['fd','request','arg'], returns: 'varies' },
    dev_read:  { cat: 'device', desc: 'Read from device', params: ['device','count'], returns: 'data' },
    dev_write: { cat: 'device', desc: 'Write to device', params: ['device','data'], returns: 'bytes_written' },

    // ── Security ──
    setuid: { cat: 'security', desc: 'Set user ID', params: ['uid'], returns: '0 on success' },
    setgid: { cat: 'security', desc: 'Set group ID', params: ['gid'], returns: '0 on success' },
    chroot: { cat: 'security', desc: 'Change root directory', params: ['path'], returns: '0 on success' },
    capset: { cat: 'security', desc: 'Set process capabilities', params: ['cap_data'], returns: '0 on success' },
  };

  // Simulated file system / process state for realistic responses
  let nextFd = 3, nextPid = 1000, nextSockFd = 10;

  function execute(name, params) {
    const def = DEFINITIONS[name];
    if (!def) return { success: false, error: `Unknown syscall: ${name}` };
    const delay = 20 + Math.random() * 80;
    const result = simulateResult(name, params);
    return { success: true, syscall: name, category: def.cat, params, result, latency: Math.round(delay) + 'µs' };
  }

  function simulateResult(name, p) {
    switch (name) {
      case 'open': return { fd: nextFd++, path: p[0] || '/tmp/file', flags: p[1] || 'O_RDONLY' };
      case 'read': return { bytes_read: Math.floor(Math.random() * 4096), fd: p[0] || 3 };
      case 'write': return { bytes_written: (p[1] || 'data').length, fd: p[0] || 3 };
      case 'close': return { status: 0, fd: p[0] || 3 };
      case 'stat': return { size: Math.floor(Math.random()*100000), mode: '0644', uid: 1000, gid: 1000, path: p[0] || '/tmp' };
      case 'mkdir': return { status: 0, path: p[0] || '/tmp/newdir' };
      case 'rmdir': return { status: 0, path: p[0] || '/tmp/olddir' };
      case 'unlink': return { status: 0, path: p[0] || '/tmp/file' };
      case 'chmod': return { status: 0, path: p[0], mode: p[1] || '0755' };
      case 'chown': return { status: 0, path: p[0], uid: p[1] || 0, gid: p[2] || 0 };
      case 'fork': return { child_pid: nextPid++ };
      case 'exec': return { program: p[0] || '/bin/sh', status: 'running' };
      case 'wait': return { pid: p[0] || nextPid - 1, exit_status: 0 };
      case 'exit': return { status: p[0] || 0 };
      case 'kill': return { status: 0, pid: p[0], signal: p[1] || 'SIGTERM' };
      case 'getpid': return { pid: 42 + Math.floor(Math.random() * 1000) };
      case 'getppid': return { ppid: 1 };
      case 'nice': return { new_priority: Math.max(-20, Math.min(19, parseInt(p[0]) || 0)) };
      case 'mmap': return { address: '0x7f' + Math.random().toString(16).slice(2, 10), length: p[1] || 4096 };
      case 'munmap': return { status: 0 };
      case 'brk': return { new_break: '0x' + (0x600000 + Math.floor(Math.random() * 0x10000)).toString(16) };
      case 'mprotect': return { status: 0, prot: p[2] || 'PROT_READ' };
      case 'mlock': return { status: 0, pages: Math.ceil((p[1] || 4096) / 4096) };
      case 'meminfo': return { total: '16384 MB', used: Math.floor(Math.random()*8000) + ' MB', free: Math.floor(Math.random()*8000) + ' MB', cached: Math.floor(Math.random()*4000) + ' MB' };
      case 'socket': return { sockfd: nextSockFd++, domain: p[0] || 'AF_INET', type: p[1] || 'SOCK_STREAM' };
      case 'bind': return { status: 0, port: p[2] || 8080 };
      case 'listen': return { status: 0, backlog: p[1] || 128 };
      case 'accept': return { new_sockfd: nextSockFd++, peer: '192.168.1.' + Math.floor(Math.random()*254+1) };
      case 'connect': return { status: 0, remote: (p[1] || '127.0.0.1') + ':' + (p[2] || 80) };
      case 'send': return { bytes_sent: (p[1] || 'data').length };
      case 'recv': return { bytes_received: Math.floor(Math.random() * 1500), data: '<binary>' };
      case 'ioctl': return { status: 0, request: p[1] || 'TIOCGWINSZ' };
      case 'dev_read': return { bytes: Math.floor(Math.random() * 512), device: p[0] || '/dev/sda' };
      case 'dev_write': return { bytes_written: (p[1] || '').length || 64, device: p[0] || '/dev/sda' };
      case 'setuid': return { status: 0, uid: p[0] || 0 };
      case 'setgid': return { status: 0, gid: p[0] || 0 };
      case 'chroot': return { status: 0, new_root: p[0] || '/jail' };
      case 'capset': return { status: 0, capabilities: p[0] || 'CAP_NET_ADMIN' };
      default: return { status: 0 };
    }
  }

  function getDefinition(name) { return DEFINITIONS[name] || null; }
  function getAllDefinitions() { return { ...DEFINITIONS }; }
  function getCategories() { return { ...CATEGORIES }; }

  return { execute, getDefinition, getAllDefinitions, getCategories, DEFINITIONS, CATEGORIES };
})();
