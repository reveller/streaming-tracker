# Cloud Deployment Guide — AWS Lightsail

This guide documents deploying the Streaming Tracker to AWS Lightsail so it's
accessible from anywhere (phone, tablet, etc.) without needing the laptop running.

**Branch**: `cloud-deploy` (local-only version preserved on `main`)
**AWS Profile**: `reveller-20250816`
**Region**: `us-east-1` (Virginia)
**Estimated Cost**: ~$12/mo (Lightsail small_3_0: 2 vCPU, 2GB RAM, 60GB disk)

---

## Overview

```
┌─────────────────────────────────────────────────┐
│  Lightsail Instance (Ubuntu 22.04)              │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Frontend │  │ Backend  │  │  Neo4j   │      │
│  │  (nginx) │→ │ (Express)│→ │   (DB)   │      │
│  │  :80/443 │  │  :3001   │  │  :7687   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
│  Certbot (Let's Encrypt SSL)                    │
└─────────────────────────────────────────────────┘
         ↑
   yourdomain.com (DNS A record → static IP)
```

---

## Step-by-Step Deployment

### Step 1: Create the Lightsail Instance

```bash
# Create instance with Ubuntu 22.04
aws lightsail create-instances \
  --profile reveller-20250816 \
  --instance-names streaming-tracker \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id small_3_0 \
  --tags key=project,value=streaming-tracker

# Wait for instance to be running
aws lightsail get-instance \
  --profile reveller-20250816 \
  --instance-name streaming-tracker \
  --query 'instance.state.name'
```

### Step 2: Allocate a Static IP

```bash
# Create and attach a static IP so the address doesn't change on reboot
aws lightsail allocate-static-ip \
  --profile reveller-20250816 \
  --static-ip-name streaming-tracker-ip

aws lightsail attach-static-ip \
  --profile reveller-20250816 \
  --static-ip-name streaming-tracker-ip \
  --instance-name streaming-tracker
```

### Step 3: Open Firewall Ports

```bash
# Open HTTP (80), HTTPS (443), and SSH (22, already open by default)
aws lightsail open-instance-public-ports \
  --profile reveller-20250816 \
  --instance-name streaming-tracker \
  --port-info fromPort=80,toPort=80,protocol=tcp

aws lightsail open-instance-public-ports \
  --profile reveller-20250816 \
  --instance-name streaming-tracker \
  --port-info fromPort=443,toPort=443,protocol=tcp
```

### Step 4: SSH into the Instance and Install Docker

```bash
# Download the SSH key
aws lightsail download-default-key-pair \
  --profile reveller-20250816 \
  --output text --query 'privateKeyBase64' | base64 -d > ~/.ssh/lightsail-streaming.pem
chmod 600 ~/.ssh/lightsail-streaming.pem

# Get the static IP
aws lightsail get-static-ip \
  --profile reveller-20250816 \
  --static-ip-name streaming-tracker-ip \
  --query 'staticIp.ipAddress' --output text

# SSH in (replace <STATIC_IP> with the IP from above)
ssh -i ~/.ssh/lightsail-streaming.pem ubuntu@<STATIC_IP>
```

**Run on the Lightsail instance:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Log out and back in for group membership to take effect
exit
```

### Step 5: Clone the Repo and Configure

```bash
# SSH back in
ssh -i ~/.ssh/lightsail-streaming.pem ubuntu@<STATIC_IP>

# Clone the repo
git clone git@github.com:reveller/streaming-tracker.git
cd streaming-tracker
git checkout cloud-deploy

# Create the .env file with production secrets
# IMPORTANT: Generate NEW secrets for production — do not reuse local dev secrets
cat > .env << 'ENVEOF'
NEO4J_PASSWORD=<generate-a-strong-password>
JWT_ACCESS_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
TMDB_API_KEY=<your-tmdb-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
ENVEOF
```

### Step 6: Tune Neo4j Memory for 2GB Instance

The local config uses 512M page cache + 1G heap, which is too much for a 2GB
instance that also runs the frontend and backend. We'll reduce these in
`docker-compose.yml` for the cloud deployment:

```yaml
# Adjusted Neo4j memory settings for small instance
- NEO4J_dbms_memory_pagecache_size=256M
- NEO4J_dbms_memory_heap_max__size=512M
```

### Step 7: Update CORS for Production Domain

In `docker-compose.yml`, update the backend CORS_ORIGIN to include your domain:

```yaml
- CORS_ORIGIN=https://yourdomain.com,http://yourdomain.com
```

### Step 8: Start the Application

```bash
docker compose up -d

# Verify all containers are healthy
docker compose ps

# Check logs if needed
docker compose logs -f
```

### Step 9: Point Your Domain (DNS)

Add an **A record** in your domain registrar (GoDaddy, etc.):

| Type | Name | Value        | TTL  |
|------|------|--------------|------|
| A    | @    | <STATIC_IP>  | 600  |

Wait for DNS propagation (usually 5–30 minutes).

### Step 10: Set Up HTTPS with Let's Encrypt

```bash
# Install Certbot on the host (not in a container)
sudo apt install -y certbot

# Stop the frontend container temporarily so certbot can use port 80
docker compose stop frontend

# Get the certificate
sudo certbot certonly --standalone -d yourdomain.com --non-interactive --agree-tos -m your@email.com

# Restart frontend
docker compose start frontend
```

Then update the nginx config to serve HTTPS (this will require modifications to
the frontend Dockerfile and nginx.conf — detailed in a follow-up step).

### Step 11: Set Up Auto-Renewal for SSL

```bash
# Add a cron job to renew certs automatically
sudo crontab -e
# Add this line:
# 0 3 * * * certbot renew --pre-hook "docker compose -f /home/ubuntu/streaming-tracker/docker-compose.yml stop frontend" --post-hook "docker compose -f /home/ubuntu/streaming-tracker/docker-compose.yml start frontend"
```

---

## Future: Adding Spanish Vocab App

Both apps can run on the same Lightsail instance using subdomain routing:

```
tracker.yourdomain.com  →  Streaming Tracker (port 80 internally)
vocab.yourdomain.com    →  Spanish Vocab (port 5050 internally)
```

This requires:
1. Clone the spanish_vocab repo alongside streaming-tracker
2. Run both docker-compose files (different container names/ports)
3. Add a host-level nginx reverse proxy that routes by subdomain
4. Get SSL certs for both subdomains

---

## Useful Commands

```bash
# SSH into the instance
ssh -i ~/.ssh/lightsail-streaming.pem ubuntu@<STATIC_IP>

# View running containers
docker compose ps

# View logs
docker compose logs -f

# Restart without losing data
docker compose restart

# Pull latest code and rebuild
git pull
docker compose up -d --build

# NEVER use: docker compose down -v (destroys all data!)
```

---

## Rollback

If you decide not to continue with cloud hosting:

```bash
# Delete the instance and static IP
aws lightsail delete-instance \
  --profile reveller-20250816 \
  --instance-name streaming-tracker

aws lightsail release-static-ip \
  --profile reveller-20250816 \
  --static-ip-name streaming-tracker-ip

# Switch back to the local-only version
git checkout main
```

The `main` branch is always available as the fully working local version.
