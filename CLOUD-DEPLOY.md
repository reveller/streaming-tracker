# Cloud Deployment Guide — AWS Lightsail

This guide documents deploying the Streaming Tracker to AWS Lightsail so it's
accessible from anywhere (phone, tablet, etc.) without needing the laptop running.

**Branch**: `cloud-deploy` (local-only version preserved on `main`)
**AWS Profile**: `reveller-20250816`
**Region**: `us-east-1` (Virginia)
**Domain**: `tracker.n2deep.co`
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
│  AWS SES (email)    Certbot (Let's Encrypt SSL) │
└─────────────────────────────────────────────────┘
         ↑
   tracker.n2deep.co (DNS A record → static IP)
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

## Invitation System & AWS SES Email

The app uses an invitation-only registration model. Admin users send email
invitations via AWS SES, and recipients click a link to create their account.
SES is also used for password reset emails.

### How It Works

1. Admin opens **Settings > Invite Users** and enters an email address
2. Backend generates a secure token, stores the invitation in Neo4j, and sends
   an email via AWS SES with a registration link
3. Recipient clicks the link → lands on `/register?token=...` → creates account
4. Admin can view invitation history and delete invitations (trash icon)

### Email Types Sent via SES

| Email                  | Trigger                            | Link Expiry  |
|------------------------|------------------------------------|--------------|
| Invitation             | Admin sends invite                 | 10 minutes   |
| Password Reset         | User clicks "Forgot your password" | 15 minutes   |

### AWS SES Sandbox Mode

SES starts in **sandbox mode**, which means you can only send emails to
**verified** email addresses. Both the sender (`noreply@n2deep.co`) and every
recipient must be verified.

#### Verify the Sender Domain/Email

The sender address `noreply@n2deep.co` must be verified. This is typically done
by verifying the entire `n2deep.co` domain via DNS (DKIM records) in the AWS SES
console.

#### Verify a Recipient Email Address (Sandbox)

Before you can send invitations or password reset emails to a new address, you
must verify it in SES:

```bash
# Verify a new email address for SES sandbox
aws ses verify-email-identity \
  --profile reveller-20250816 \
  --region us-east-1 \
  --email-address user@example.com
```

The recipient will receive a verification email from AWS. They must click the
confirmation link **before** the app can send them an invitation or password
reset email.

#### Check Verification Status

```bash
# List all verified email addresses
aws ses list-identities \
  --profile reveller-20250816 \
  --region us-east-1 \
  --identity-type EmailAddress

# Check a specific email's verification status
aws ses get-identity-verification-attributes \
  --profile reveller-20250816 \
  --region us-east-1 \
  --identities user@example.com
```

#### Moving Out of Sandbox

To send emails to **any** address without pre-verification, you must request
production access in the AWS SES console:

1. Go to **SES Console > Account dashboard**
2. Click **Request production access**
3. Fill out the use case (invitation-only app, low volume)
4. AWS typically approves within 24 hours

### Environment Variables for Email

These are configured in `docker-compose.yml` under the backend service:

| Variable                     | Value                           | Description                      |
|------------------------------|---------------------------------|----------------------------------|
| `AWS_SES_REGION`             | `us-east-1`                     | AWS region for SES               |
| `SES_FROM_EMAIL`             | `noreply@n2deep.co`             | Sender address (must be verified)|
| `INVITATION_EXPIRY_MINUTES`  | `10`                            | Invitation link expiry           |
| `FRONTEND_URL`               | `https://tracker.n2deep.co`     | Base URL for email links         |

> **Note**: The backend container uses the Lightsail instance's IAM role for
> SES permissions. No AWS access keys are stored in the `.env` file.

### Troubleshooting Email

```bash
# Check backend logs for SES errors
docker logs streaming-tracker-backend 2>&1 | grep -i "ses\|email\|invitation"

# Test SES connectivity from the instance
aws ses get-send-quota --region us-east-1

# Common errors:
# - "Email address is not verified" → Run verify-email-identity for that address
# - "Access Denied" → Check IAM role has ses:SendEmail permission
# - "Throttling" → You're hitting sandbox sending limits (1 email/sec, 200/day)
```

---

## Security Features

### Account Lockout

After **5 failed login attempts**, the account is locked for **10 minutes**.
The lockout counter resets on successful login.

- Lockout status is stored on the User node in Neo4j (`failedLoginAttempts`,
  `lockedUntil`)
- The login endpoint returns HTTP 423 with `minutesRemaining` when locked

### Password Reset

1. User clicks "Forgot your password?" on the login page
2. Enters their email → backend silently returns 200 (prevents email enumeration)
3. If a verified account exists, a reset email is sent via SES
4. User clicks link → `/reset-password?token=...` → sets new password
5. Token is SHA-256 hashed before storage; expires in 15 minutes

---

## Deploying Updates

### Standard Deployment (Code Changes)

```bash
# SSH into the instance
ssh -i ~/.ssh/lightsail-streaming.pem ubuntu@<STATIC_IP>

cd streaming-tracker
git pull

# Rebuild and restart only the containers that changed
docker compose up -d --build backend
docker compose up -d --build frontend
```

### When Source Files Change But package.json Doesn't

Docker may cache build layers and skip your code changes. Use `--no-cache`:

```bash
docker compose build --no-cache backend && docker compose up -d backend
docker compose build --no-cache frontend && docker compose up -d frontend
```

### Updating Environment Variables

If you change `.env` or environment values in `docker-compose.yml`:

```bash
# Restart the affected container to pick up new env vars
docker compose up -d backend
```

### Updating the Anthropic API Key

```bash
# Edit .env on the instance
nano .env
# Update the ANTHROPIC_API_KEY value, save

# Restart backend to load the new key
docker compose up -d backend
```

### After Deployment: Client-Side Caching

After rebuilding the frontend container, users may need to do a **hard reload**
(`Ctrl+Shift+R` or "Empty Cache and Hard Reload") in their browser to pick up
the new JavaScript bundle. This is only needed when frontend code changes.

---

## Useful Commands

```bash
# SSH into the instance
ssh -i ~/.ssh/lightsail-streaming.pem ubuntu@<STATIC_IP>

# View running containers
docker compose ps

# View logs (all containers)
docker compose logs -f

# View logs (specific container)
docker logs streaming-tracker-backend -f

# Restart without losing data
docker compose restart

# Restart a single container
docker compose restart backend

# Pull latest code and rebuild
git pull
docker compose up -d --build

# ⚠️  NEVER use: docker compose down -v (destroys all data!)
```

### Neo4j Database Access

```bash
# Run a Cypher query from the host
docker exec streaming-tracker-neo4j cypher-shell \
  -u neo4j -p "$NEO4J_PASSWORD" \
  "MATCH (u:User) RETURN u.username, u.email, u.role"

# Delete a specific user (replace email)
docker exec streaming-tracker-neo4j cypher-shell \
  -u neo4j -p "$NEO4J_PASSWORD" \
  "MATCH (u:User {email: 'user@example.com'}) DETACH DELETE u"
```

### Application Logs

The backend uses Winston for structured JSON logging with daily file rotation.
Logs are persisted in the `backend_logs` Docker volume so they survive container
rebuilds.

**Log files:**

| File Pattern | Contents | Retention |
|---|---|---|
| `app-YYYY-MM-DD.log` | All application logs | 30 days |
| `audit-YYYY-MM-DD.log` | Security & audit events only | 90 days |

**Audit events captured:**

| Event | Details |
|---|---|
| `LOGIN_SUCCESS` | email, userId, IP, user agent |
| `LOGIN_FAILED` | email, IP, user agent |
| `ACCOUNT_LOCKED` | email, IP, minutes remaining |
| `PASSWORD_CHANGED` | userId, IP |
| `PASSWORD_RESET_REQUESTED` | email, IP |
| `PASSWORD_RESET_COMPLETED` | IP |
| `INVITATION_SENT` | email, inviterId |
| `INVITATION_REDEEMED` | username, email, userId |
| `INVITATION_DELETED` | invitationId, deletedBy |
| `RECOMMENDATIONS_REQUESTED` | userId, genre, count, results returned |

```bash
# View live backend console output (structured JSON in production)
docker logs streaming-tracker-backend -f

# View today's full application log
docker exec streaming-tracker-backend cat /app/logs/app-$(date +%Y-%m-%d).log

# View today's audit log (security events only)
docker exec streaming-tracker-backend cat /app/logs/audit-$(date +%Y-%m-%d).log

# Tail the audit log in real time
docker exec streaming-tracker-backend tail -f /app/logs/audit-$(date +%Y-%m-%d).log

# View a specific date's audit log
docker exec streaming-tracker-backend cat /app/logs/audit-2026-03-16.log

# List all log files
docker exec streaming-tracker-backend ls -lh /app/logs/

# Search audit logs for a specific event (e.g., failed logins)
docker exec streaming-tracker-backend grep "LOGIN_FAILED" /app/logs/audit-$(date +%Y-%m-%d).log

# Search audit logs for a specific email
docker exec streaming-tracker-backend grep "user@example.com" /app/logs/audit-$(date +%Y-%m-%d).log

# Count failed login attempts today
docker exec streaming-tracker-backend grep -c "LOGIN_FAILED" /app/logs/audit-$(date +%Y-%m-%d).log
```

> **Note**: Log files are stored inside the container at `/app/logs/` and backed
> by the `backend_logs` Docker volume. They persist across container rebuilds but
> would be lost if the volume is removed (`docker volume rm`).

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

---

## Spanish Vocab App (Deployed)

Both apps run on the same Lightsail instance using subdomain routing:

```
tracker.n2deep.co  →  nginx :443  →  Streaming Tracker (127.0.0.1:8080)
vocab.n2deep.co    →  nginx :443  →  Spanish Vocab    (127.0.0.1:5050)
```

**Domain**: `vocab.n2deep.co`
**Repo**: `/home/ubuntu/spanish-vocab`
**Container**: `spanish-vocab-app-1` (Gunicorn + Flask + SQLite)

### How It Was Set Up

1. Added an **A record** for `vocab` in GoDaddy DNS pointing to the same static IP (`13.223.202.61`)
2. Cloned the repo on the instance:
   ```bash
   cd /home/ubuntu
   git clone https://github.com/reveller/spanish-vocab.git
   ```
3. Created `.env` with `SECRET_KEY` and one-time `SEED_USER_EMAIL`/`SEED_USER_PASSWORD` for initial user creation
4. Started the app:
   ```bash
   cd /home/ubuntu/spanish-vocab
   docker compose up -d --build
   ```
5. Added nginx site config at `/etc/nginx/sites-available/vocab.n2deep.co`:
   ```nginx
   server {
       listen 80;
       server_name vocab.n2deep.co;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name vocab.n2deep.co;

       ssl_certificate /etc/letsencrypt/live/tracker.n2deep.co/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/tracker.n2deep.co/privkey.pem;

       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;

       location / {
           proxy_pass http://127.0.0.1:5050;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
6. Enabled and reloaded nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vocab.n2deep.co /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
7. Removed seed credentials from `.env` after first run (user already stored in SQLite)

### SSL Certificate

Both subdomains share a single Let's Encrypt certificate:
```
Certificate Name: tracker.n2deep.co
Domains: tracker.n2deep.co vocab.n2deep.co
Path: /etc/letsencrypt/live/tracker.n2deep.co/
```

### Deploying Vocab App Updates

```bash
ssh -i ~/.ssh/lightsail-streaming.pem ubuntu@13.223.202.61
cd /home/ubuntu/spanish-vocab
git pull
docker compose up -d --build
```

### Useful Vocab Commands

```bash
# View container status
docker compose -f /home/ubuntu/spanish-vocab/docker-compose.yml ps

# View logs
docker compose -f /home/ubuntu/spanish-vocab/docker-compose.yml logs -f

# Restart
docker compose -f /home/ubuntu/spanish-vocab/docker-compose.yml restart

# Health check
curl -s http://localhost:5050/api/health
```
