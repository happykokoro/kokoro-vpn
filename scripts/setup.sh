#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Kokoro VPN — One-click server setup
# Run this on a fresh Ubuntu/Debian VPS:
#   curl -fsSL https://raw.githubusercontent.com/happykokoro/kokoro-vpn/main/scripts/setup.sh | bash
# ============================================

echo "==> Kokoro VPN Setup"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo bash setup.sh"
  exit 1
fi

# Detect public IP
PUBLIC_IP=$(curl -4 -s ifconfig.me || curl -4 -s icanhazip.com)
echo "==> Detected public IP: $PUBLIC_IP"

# Install Docker if missing
if ! command -v docker &> /dev/null; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  echo "==> Docker installed."
else
  echo "==> Docker already installed."
fi

# Install Docker Compose plugin if missing
if ! docker compose version &> /dev/null; then
  echo "==> Installing Docker Compose plugin..."
  apt-get update -qq && apt-get install -y -qq docker-compose-plugin
fi

# Clone repo
INSTALL_DIR="/opt/kokoro-vpn"
if [ -d "$INSTALL_DIR" ]; then
  echo "==> Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --ff-only
else
  echo "==> Cloning kokoro-vpn..."
  git clone https://github.com/happykokoro/kokoro-vpn.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Generate .env if not present
if [ ! -f .env ]; then
  echo "==> Generating .env..."
  cp .env.example .env

  # Set the public IP
  sed -i "s|WG_HOST=.*|WG_HOST=$PUBLIC_IP|" .env

  # Prompt for password
  read -rsp "Enter a password for the web UI: " UI_PASSWORD
  echo ""

  # Generate bcrypt hash using Docker
  PASSWORD_HASH=$(docker run --rm ghcr.io/wg-easy/wg-easy wgpw "$UI_PASSWORD" 2>/dev/null | grep -oP '\$2[aby]\$.*')
  # Escape $ for docker compose
  ESCAPED_HASH=$(echo "$PASSWORD_HASH" | sed 's/\$/\$\$/g')

  # Write hash to .env
  echo "PASSWORD_HASH=$ESCAPED_HASH" >> .env
  echo "==> Password configured."
fi

# Configure firewall
echo "==> Configuring firewall..."
if command -v ufw &> /dev/null; then
  ufw allow 51820/udp comment "WireGuard VPN"
  ufw allow 51821/tcp comment "WireGuard Web UI"
  echo "==> UFW rules added."
elif command -v firewall-cmd &> /dev/null; then
  firewall-cmd --permanent --add-port=51820/udp
  firewall-cmd --permanent --add-port=51821/tcp
  firewall-cmd --reload
  echo "==> firewalld rules added."
else
  echo "==> No firewall detected. Make sure ports 51820/udp and 51821/tcp are open."
fi

# Start
echo "==> Starting Kokoro VPN..."
docker compose up -d

echo ""
echo "============================================"
echo "  Kokoro VPN is running!"
echo "============================================"
echo ""
echo "  Web UI:  http://$PUBLIC_IP:51821"
echo "  VPN Port: $PUBLIC_IP:51820/udp"
echo ""
echo "  To manage:"
echo "    cd $INSTALL_DIR"
echo "    docker compose logs -f"
echo "    docker compose restart"
echo ""
echo "  Next steps:"
echo "    1. Open the Web UI in your browser"
echo "    2. Log in with the password you set"
echo "    3. Create client configs for your devices"
echo "    4. Download & import configs into WireGuard app"
echo "============================================"
