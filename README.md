# Kokoro VPN

A self-hosted WireGuard VPN platform with a custom API server, desktop client, and marketing website.

## Architecture

```
kokoro-vpn/
  server/        Rust API backend (Axum, SQLite, JWT auth)
  desktop/       Tauri v2 desktop client (Windows, macOS)
  website/       Marketing site and sandbox demo (Vite + React)
  terraform/     Infrastructure as Code (DigitalOcean)
  scripts/       Server setup and uninstall scripts
  docker-compose.yml   Production deployment
```

The server manages WireGuard directly via `wg` and `wg-quick`, replacing the
legacy wg-easy container with a full REST API that supports multi-user accounts,
device management, traffic stats, and time-limited guest sandbox access.

## Tech Stack

| Component | Technologies |
|-----------|-------------|
| Server | Rust (edition 2024), Axum 0.8, SQLite (sqlx 0.8), JWT (jsonwebtoken 9), Argon2 password hashing, tower-http (CORS, tracing, rate limiting) |
| Desktop | Tauri v2, React 19, TypeScript, Tailwind CSS v4, TanStack React Query v5, Vite 6 |
| Website | React 19, TypeScript, Tailwind CSS v4, Vite 6, QR code generation |
| Infra | Docker, Caddy (auto-HTTPS), Terraform (DigitalOcean), GitHub Actions CI/CD |

## Server

The backend lives in `server/` and exposes a REST API on port 3000.

**Modules:**
- `auth/` -- registration, login, JWT issuance, auth middleware
- `users/` -- user profile and admin user management
- `wireguard/` -- device CRUD, WireGuard config generation, live traffic stats
- `sandbox/` -- time-limited guest access with automatic cleanup
- `config.rs` -- environment-based configuration
- `db.rs` -- SQLite connection pool and migrations
- `errors.rs` -- unified error handling

**API routes:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/users` | List all users (admin) |
| DELETE | `/api/users/{id}` | Delete a user (admin) |
| POST | `/api/devices` | Create a WireGuard device |
| GET | `/api/devices` | List user's devices |
| DELETE | `/api/devices/{id}` | Remove a device |
| GET | `/api/wg/stats` | Live WireGuard traffic stats |
| POST | `/api/sandbox/guest` | Create a temporary guest tunnel |
| GET | `/api/servers` | List active server profiles |

**Setup:**

```bash
cd server
cp .env.example .env
# Edit .env: set JWT_SECRET, WG_ENDPOINT, ADMIN_PASSWORD, WireGuard keys
cargo run
```

Required environment variables: `JWT_SECRET`, `WG_ENDPOINT`. An admin account is
created automatically on first run using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Desktop Client

A cross-platform desktop app in `desktop/` built with Tauri v2. It connects to the
server API, manages VPN tunnels, and provides a native system tray experience.

**Features:**
- Login and device management via the server API
- One-click VPN connect/disconnect (calls `wireguard.exe` on Windows, `wg-quick` on macOS)
- Connection status monitoring
- Device list with QR code display
- Traffic statistics
- Persistent auth via `tauri-plugin-store`

**Setup:**

```bash
cd desktop
npm install
npm run tauri dev
```

**Build for release:**

```bash
npm run tauri build
```

Automated releases are handled by the `release-desktop.yml` workflow, which builds
for Windows and macOS (both ARM and Intel) on version tags (`v*`).

## Website

A marketing and demo site in `website/` with three pages:

- **Landing** -- product overview
- **DemoApp** -- interactive UI demo
- **Sandbox** -- guest VPN trial with QR code provisioning

**Setup:**

```bash
cd website
npm install
npm run dev
```

Deployed to GitHub Pages automatically on pushes to `main` via the
`deploy-website.yml` workflow.

## Deployment

### Docker Compose (production)

The primary `docker-compose.yml` runs the Axum API server in a container with
`network_mode: host` so it can manage WireGuard on the host.

```bash
cp server/.env.example server/.env
# Edit server/.env
docker compose up -d
```

To add HTTPS, uncomment the Caddy service in `docker-compose.yml` and configure
your domain in the Caddyfile.

### One-line server setup

```bash
curl -fsSL https://raw.githubusercontent.com/happykokoro/kokoro-vpn/main/scripts/setup.sh | sudo bash
```

### Terraform (DigitalOcean)

Provisions an Ubuntu 24.04 droplet with firewall rules for WireGuard (UDP 51820),
the API (TCP 51821), and SSH.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Set do_token and ssh_key_fingerprint
terraform init && terraform apply
```

The `deploy.yml` workflow provides a manual GitHub Actions trigger for
plan/apply/destroy.

### Demo site only

```bash
cd website && npm run build
docker compose -f docker-compose.demo.yml up -d
```

## Uninstall

```bash
sudo bash /opt/kokoro-vpn/scripts/uninstall.sh
```

## License

MIT
