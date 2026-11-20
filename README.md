# Nginx Proxy Manager — MCP Server

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-%23007ACC?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-%23339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP-%40modelcontextprotocol%2Fsdk%401.12.1-brightgreen?style=flat-square)](https://modelcontextprotocol.io/)
[![npm](https://img.shields.io/badge/npm-packages-19-blue?style=flat-square)](#available-tools)

> **Manage your Nginx Proxy Manager fleet from any MCP-host AI chat.** Create proxy hosts, rotate certificates, flip redirections — without ever opening the admin dashboard.

---

## Architecture

```
┌──────────────────────┐         ┌─────────────────────────┐         ┌───────────────────┐
│   MCP Host (AI)      │         │   nginxpm-mcp server    │         │ Nginx Proxy Mgr   │
│                      │  stdio  │                         │  HTTP   │                   │
│  "Create a proxy     │◄───────►│  McpServer              │◄───────►│  /api/hosts       │
│   for api.example.com"│        │  ┌───────────────────┐  │        │  /api/certificates│
│                      │         │  │ list-proxy-hosts   │  │        │  /api/tokens      │
│  "Renew cert #3"     │         │  │ create-proxy-host  │  │        │                   │
│                      │         │  │ renew-certificate  │  │        └───────────────────┘
│                      │         │  │ … 19 tools total   │  │
│                      │         │  │     ↓             │  │
│                      │         │  │ [NpmClient×N]     │  │
│                      │         │  └───────────────────┘  │
└──────────────────────┘         └─────────────────────────┘
```

Each config entry spawns an isolated `NpmClient` with its own JWT token cache and retry logic.

---

## Features

- **19 tools** covering full CRUD + enable/disable for proxy hosts, redirection hosts, and certificates
- **Multi-instance** — manage several NPM deployments from one server instance
- **Auto-reauth on 401/403** — transparent re-login without dropping requests
- **Self-signed TLS** — works with dev instances using self-signed certificates
- **Zero external deps** beyond the MCP SDK, undici, and zod

---

## Installation

```bash
# Clone & build
git clone https://github.com/coe-artificial/nginxpm-mcp.git
cd nginxpm-mcp
npm install
npm run build

# Install globally (optional)
npm install -g .
```

---

## Configuration

Create `npm-config.json` with one or more NPM instances:

```json
{
  "dgx": {
    "address": "http://10.0.0.10:81",
    "username": "admin@example.com",
    "password": "your-password"
  },
  "production": {
    "address": "https://npm.example.com",
    "username": "admin@example.com",
    "password": "your-password"
  }
}
```

> **Tip:** This file is gitignored by default — never commit real credentials.

Run the server:

```bash
# Linux / macOS
NPMCP_CONFIG=./npm-config.json nginxpm-mcp

# Windows (PowerShell)
$env:NPMCP_CONFIG = (Resolve-Path .\npm-config.json).Path
nginxpm-mcp

# Windows (CMD)
set NPMCP_CONFIG=%cd%\npm-config.json
nginxpm-mcp
```

---

## Usage with MCP Hosts

### Claude Desktop integration

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nginxpm": {
      "command": "nginxpm-mcp",
      "env": {
        "NPMCP_CONFIG": "C:\\Users\\you\\npm-config.json"
      }
    }
  }
}
```

### Cursor / Windsurf integration

```jsonc
// .cursor/mcp.json
{
  "mcpServers": {
    "nginxpm": {
      "command": "npx",
      "args": ["nginxpm-mcp"],
      "env": {
        "NPMCP_CONFIG": "./npm-config.json"
      }
    }
  }
}
```

---

## Usage Examples

### Example 1 — List all proxy hosts and summarize

```
User: List all my proxy hosts and tell me which ones are disabled.

AI → calls list-proxy-hosts → gets JSON array
AI → parses response, reports:
  "You have 8 proxy hosts. 2 are disabled:
   - Host #3  (staging.example.com → 10.0.0.5:8080)
   - Host #7  (internal.example.com → 10.0.0.6:3000)"
```

### Example 2 — Create a reverse proxy with Let's Encrypt

```
User: Set up a reverse proxy for api.internal.com pointing at 192.168.1.50:8443 with HTTPS.

AI → calls create-proxy-host with:
{
  "name": "api.internal.com",
  "domainNames": ["api.internal.com"],
  "forwardScheme": "https",
  "forwardHost": "192.168.1.50",
  "forwardPort": 8443,
  "certificate": null,
  "sslForce": true,
  "hstsEnabled": true
}

AI: "Proxy host created. Force HTTPS is enabled — all HTTP traffic will be redirected."
```

### Example 3 — Bulk enable all disabled redirections

```
User: I'm decommissioning old services. Enable all disabled redirection hosts.

AI → calls list-redirection-hosts → finds disabled ones
AI → calls enable-redirection-host for each
AI: "Enabled 3 redirection hosts. All are now live."
```

### Example 4 — Rotate a certificate

```
User: Certificate #5 is about to expire. Renew it.

AI → calls renew-certificate({ instance: "production", id: 5 })
AI: "Certificate renewed successfully. Expiry is now 2027-02-15."
```

### Example 5 — Add a temporary redirect

```
User: Point blog.example.com to https://newsite.example.com for now.

AI → calls create-redirection-host with:
{
  "name": "blog-redirect",
  "domains": ["blog.example.com"],
  "forwardScheme": "https",
  "forwardDomainName": "newsite.example.com",
  "forwardPort": 443,
  "preserveHost": true,
  "redirectCode": 302
}

AI: "Temporary redirect created (302). Blog visitors will be forwarded to the new site."
```

---

## Available Tools

### Proxy Hosts (7 tools)

| Tool | Description |
|------|-------------|
| `list-proxy-hosts` | List all proxy hosts |
| `get-proxy-host` | Get proxy host by ID |
| `create-proxy-host` | Create a new proxy host |
| `update-proxy-host` | Update a proxy host |
| `delete-proxy-host` | Delete a proxy host |
| `enable-proxy-host` | Enable a proxy host vhost |
| `disable-proxy-host` | Disable a proxy host vhost |

### Certificates (6 tools)

| Tool | Description |
|------|-------------|
| `list-certificates` | List all certificates |
| `get-certificate` | Get certificate by ID |
| `create-certificate` | Create a Let's Encrypt or manual certificate |
| `renew-certificate` | Renew a certificate |
| `delete-certificate` | Delete a certificate |

### Redirection Hosts (6 tools)

| Tool | Description |
|------|-------------|
| `list-redirection-hosts` | List all redirection hosts |
| `get-redirection-host` | Get redirection host by ID |
| `create-redirection-host` | Create a new redirection host |
| `update-redirection-host` | Update a redirection host |
| `delete-redirection-host` | Delete a redirection host |
| `enable-redirection-host` | Enable a redirection host vhost |
| `disable-redirection-host` | Disable a redirection host vhost |

---

## How It Works

1. **Auth** — JWT Bearer tokens via `POST /api/tokens`, cached with proactive 60-second refresh
2. **Retry** — 401/403 triggers re-auth + retry; 5xx adds 200ms delay + retry
3. **Self-signed TLS** — `undici` agent with `rejectUnauthorized: false` for dev environments
4. **Multi-instance** — each config entry creates a separate `NpmClient` with its own token cache

---

## License

MIT © [coe-artificial](https://github.com/coe-artificial)
