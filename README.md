# Kokoro VPN

Self-hosted WireGuard VPN with a web management UI. Deploy in minutes on any VPS.

## Features

- **WireGuard** — fast, modern, lightweight VPN protocol
- **Web UI** — manage clients, view traffic stats, generate QR codes
- **Multi-platform** — works on Windows, macOS, Linux, iOS, Android
- **One-click deploy** — single script sets up everything
- **Infrastructure as Code** — optional Terraform configs for DigitalOcean
- **CI/CD** — GitHub Actions workflow for automated deployment

## Quick Start

### Option 1: One-line install on any VPS

SSH into a fresh Ubuntu/Debian server and run:

```bash
curl -fsSL https://raw.githubusercontent.com/happykokoro/kokoro-vpn/main/scripts/setup.sh | sudo bash
```

This installs Docker, configures WireGuard, and starts the web UI.

### Option 2: Manual Docker Compose

```bash
git clone https://github.com/happykokoro/kokoro-vpn.git
cd kokoro-vpn
cp .env.example .env
# Edit .env — set WG_HOST to your server IP and PASSWORD_HASH
docker compose up -d
```

### Option 3: Terraform (DigitalOcean)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your DO token and SSH key
terraform init
terraform apply
```

## Client Setup

1. Open the Web UI at `http://YOUR_SERVER_IP:51821`
2. Log in with your password
3. Click **"New Client"** to create a config
4. Download the config file or scan the QR code

Install the WireGuard client for your platform:

| Platform | Install |
|----------|---------|
| Windows  | [Download](https://www.wireguard.com/install/) |
| macOS    | [App Store](https://apps.apple.com/app/wireguard/id1451685025) |
| iOS      | [App Store](https://apps.apple.com/app/wireguard/id1441195209) |
| Android  | [Play Store](https://play.google.com/store/apps/details?id=com.wireguard.android) |
| Linux    | `sudo apt install wireguard` |

Import the downloaded `.conf` file or scan the QR code in the app.

## Optional: HTTPS with Caddy

To put the web UI behind HTTPS:

1. Set `DOMAIN` and `EMAIL` in `.env`
2. Uncomment the `caddy` service in `docker-compose.yml`
3. Uncomment the `caddy-data` and `caddy-config` volumes
4. Point your domain's DNS A record to the server IP
5. `docker compose up -d`

## CI/CD Deployment

Add these secrets to your GitHub repo:

- `DO_TOKEN` — DigitalOcean API token
- `SSH_KEY_FINGERPRINT` — your SSH key fingerprint

Then go to **Actions > Deploy VPN > Run workflow** and select `apply`.

## Architecture

```
┌─────────────────────────────────────┐
│              VPS                     │
│  ┌───────────────────────────────┐  │
│  │  Docker                       │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  wg-easy container      │  │  │
│  │  │  ├─ WireGuard :51820/udp│  │  │
│  │  │  └─ Web UI    :51821/tcp│  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  caddy (optional)       │  │  │
│  │  │  └─ HTTPS :443 → :51821│  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ▲           ▲
         │ UDP       │ TCP
    ┌────┴───┐  ┌────┴───┐
    │ Phone  │  │ Laptop │
    │ (VPN)  │  │ (Web)  │
    └────────┘  └────────┘
```

## Uninstall

```bash
sudo bash /opt/kokoro-vpn/scripts/uninstall.sh
```

## License

MIT
