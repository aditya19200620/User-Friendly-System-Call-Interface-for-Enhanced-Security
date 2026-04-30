# 🛡️ SecureKernel — System Call Security Interface

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](index.html)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](js/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](css/)

> A user-friendly, web-based system call interface that enhances security through role-based authentication, real-time access control enforcement, and comprehensive audit logging.

---

## 🎯 Overview

**SecureKernel** simulates how an operating system kernel can expose system calls through an authenticated, role-based interface. It demonstrates core OS security concepts in an interactive, visually engaging environment.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Login system with 4 user roles and session management |
| 🛡️ **RBAC Engine** | Role-based access control for 34 system calls across 6 categories |
| 💻 **Interactive Terminal** | CLI with autocomplete, command history, and colored output |
| 📋 **Audit Logging** | Real-time log stream with filtering, search, and CSV export |
| 📈 **Analytics Dashboard** | Canvas-based charts showing usage patterns and security threats |
| ⚡ **Kernel Mode Visualization** | Animated transitions showing user-space to kernel-mode switching |

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- No build tools, frameworks, or dependencies required

### Installation

```bash
git clone https://github.com/your-username/secure-kernel.git
cd secure-kernel
```

### Usage

Open `index.html` in your browser, or serve it locally:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# VS Code
# Use the Live Server extension
```

### Demo Credentials

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| `root` | `toor` | Root | Full access to all syscalls |
| `admin` | `admin123` | Admin | All except security syscalls |
| `user` | `user123` | Standard | File R/W, limited process & network |
| `guest` | `guest` | Guest | Read-only access |

---

## 📐 Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend UI                 │
│  ┌──────────┬──────────┬──────────────────┐  │
│  │  Login   │ Terminal │   Dashboard      │  │
│  │  Screen  │   CLI    │   & Analytics    │  │
│  └──────────┴──────────┴──────────────────┘  │
├─────────────────────────────────────────────┤
│              Application Layer               │
│  ┌──────┐  ┌──────┐  ┌────────┐  ┌───────┐  │
│  │ Auth │  │ RBAC │  │Syscalls│  │Logger │  │
│  │Module│──│Engine│──│ Engine │──│System │  │
│  └──────┘  └──────┘  └────────┘  └───────┘  │
├─────────────────────────────────────────────┤
│         Simulated Kernel Interface           │
│     34 syscalls · 6 categories · POSIX       │
└─────────────────────────────────────────────┘
```

### System Call Categories

| Category | Syscalls | Examples |
|----------|----------|---------|
| 📁 File I/O | 10 | `open`, `read`, `write`, `chmod`, `stat` |
| ⚙️ Process | 8 | `fork`, `exec`, `kill`, `getpid`, `nice` |
| 🧠 Memory | 6 | `mmap`, `munmap`, `brk`, `mprotect` |
| 🌐 Network | 7 | `socket`, `bind`, `connect`, `send` |
| 🔌 Device | 3 | `ioctl`, `dev_read`, `dev_write` |
| 🔒 Security | 4 | `setuid`, `setgid`, `chroot`, `capset` |

---

## 📂 Project Structure

```
secure-kernel/
├── index.html          # Main entry point with all UI sections
├── css/
│   └── styles.css      # Complete dark-mode glassmorphism design system
├── js/
│   ├── auth.js         # Authentication & session management
│   ├── rbac.js         # Role-based access control engine
│   ├── syscalls.js     # 34 system call definitions & simulation
│   ├── logger.js       # Audit logging with filters & CSV export
│   ├── terminal.js     # Interactive terminal with autocomplete
│   ├── dashboard.js    # Analytics charts & data visualization
│   └── app.js          # Main application orchestrator
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🔒 Security Model

### Permission Levels

```
none → read → limited → readwrite → full
```

Each role is assigned a permission level per syscall category. A syscall is **allowed** only if the user's role has a level ≥ the syscall's required level.

### Audit Trail

Every syscall attempt (allowed or denied) is logged with:
- Timestamp, user, role, session ID
- Syscall name, category, parameters
- Result status and severity level
- Denial reason (if applicable)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

Built as an educational project demonstrating OS security concepts through interactive web visualization.
