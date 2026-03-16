# Host-Level Nginx Configs

These are the nginx site configs installed on the Lightsail instance at
`/etc/nginx/sites-available/`. They are **not** the nginx config inside the
frontend Docker container — they run on the host and reverse-proxy to the
Docker containers.

## Installation

```bash
# Copy to the instance
sudo cp tracker.n2deep.co /etc/nginx/sites-available/

# Enable site
sudo ln -sf /etc/nginx/sites-available/tracker.n2deep.co /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## SSL Certificate

```
Certificate Name: tracker.n2deep.co
Domains: tracker.n2deep.co
Path: /etc/letsencrypt/live/tracker.n2deep.co/
```
