terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "VPS region (e.g., sgp1, nyc1, ams3, lon1)"
  type        = string
  default     = "sgp1"
}

variable "size" {
  description = "Droplet size"
  type        = string
  default     = "s-1vcpu-1gb"
}

variable "ssh_key_fingerprint" {
  description = "SSH key fingerprint registered in DigitalOcean"
  type        = string
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "vpn" {
  image    = "ubuntu-24-04-x64"
  name     = "kokoro-vpn"
  region   = var.region
  size     = var.size
  ssh_keys = [var.ssh_key_fingerprint]

  user_data = <<-EOF
    #!/bin/bash
    curl -fsSL https://raw.githubusercontent.com/happykokoro/kokoro-vpn/main/scripts/setup.sh | bash
  EOF

  tags = ["vpn", "kokoro"]
}

resource "digitalocean_firewall" "vpn" {
  name        = "kokoro-vpn-fw"
  droplet_ids = [digitalocean_droplet.vpn.id]

  inbound_rule {
    protocol         = "udp"
    port_range       = "51820"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "51821"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

output "vpn_ip" {
  description = "Public IP of the VPN server"
  value       = digitalocean_droplet.vpn.ipv4_address
}

output "web_ui_url" {
  description = "URL of the WireGuard web management UI"
  value       = "http://${digitalocean_droplet.vpn.ipv4_address}:51821"
}
