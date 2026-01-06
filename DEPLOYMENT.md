# Streaming Tracker - Deployment Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-05

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Development)](#quick-start-development)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Production Deployment](#production-deployment)
7. [Docker Deployment](#docker-deployment)
8. [Environment Configuration](#environment-configuration)
9. [Database Migrations](#database-migrations)
10. [Testing Deployment](#testing-deployment)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance](#maintenance)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Neo4j**: v5.0 or higher ([Download](https://neo4j.com/download/))
- **Git**: Latest version ([Download](https://git-scm.com/))

### Optional (for Docker deployment)

- **Docker**: v20.10 or higher ([Download](https://www.docker.com/))
- **Docker Compose**: v2.0 or higher

### API Keys Required

1. **TMDB API Key**: [Get API Key](https://www.themoviedb.org/settings/api)
2. **Anthropic API Key**: [Get API Key](https://console.anthropic.com/)

---

## Quick Start (Development)

For local development, follow these steps:

```bash
# 1. Clone the repository
git clone <repository-url>
cd streaming-tracker

# 2. Set up Neo4j (see Database Setup section)

# 3. Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# 4. Run database migrations
npm run migrate

# 5. Start backend server
npm start

# 6. In a new terminal, install frontend dependencies
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration

# 7. Start frontend development server
npm run dev
```

**Access the application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

---

## Database Setup

### Option 1: Neo4j Desktop (Recommended for Development)

1. **Download Neo4j Desktop**
   - Visit https://neo4j.com/download/
   - Download Neo4j Desktop for your OS
   - Install and launch

2. **Create a New Project**
   - Click "New Project" or "New"
   - Name it "Streaming Tracker"

3. **Create a Database**
   - Click "Add" → "Local DBMS"
   - Name: `streaming-tracker`
   - Password: Choose a strong password (save this!)
   - Version: 5.x (latest)
   - Click "Create"

4. **Start the Database**
   - Click "Start" on your database
   - Wait for it to show "Active"

5. **Verify Connection**
   - Click "Open" → "Neo4j Browser"
   - Run: `CALL dbms.components()`
   - Should show Neo4j version info

6. **Get Connection Details**
   - Default URI: `bolt://localhost:7687`
   - Username: `neo4j`
   - Password: (what you set in step 3)

### Option 2: Neo4j Community Edition (Server)

```bash
# Ubuntu/Debian
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable latest' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt-get update
sudo apt-get install neo4j

# Start Neo4j
sudo systemctl start neo4j
sudo systemctl enable neo4j

# Set initial password
cypher-shell -u neo4j -p neo4j
# You'll be prompted to change password
```

### Option 3: Docker (Neo4j)

```bash
docker run \
  --name neo4j-streaming-tracker \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  -v $HOME/neo4j/data:/data \
  -v $HOME/neo4j/logs:/logs \
  neo4j:5-community
```

### Database Configuration

The database URI and credentials will be used in the backend `.env` file:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Neo4j Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password

# JWT Configuration
JWT_ACCESS_SECRET=generate_a_random_secret_here
JWT_REFRESH_SECRET=generate_another_random_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# External APIs
TMDB_API_KEY=your_tmdb_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Logging
LOG_LEVEL=info
```

**Generate Secure Secrets**:
```bash
# On Linux/Mac
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# On Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run Database Migrations

```bash
npm run migrate
```

This creates the initial database schema (indexes and constraints).

### 4. Verify Backend Setup

```bash
# Run tests
npm test

# Check linting
npm run lint

# Start development server
npm run dev
```

Server should start on http://localhost:3001

**Test the API**:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-05T...",
    "uptime": 1.234
  }
}
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
```

For production, change to your production API URL.

### 3. Verify Frontend Setup

```bash
# Run linting
npm run lint

# Start development server
npm run dev
```

Frontend should start on http://localhost:5173

**Test the application**:
1. Open http://localhost:5173
2. You should see the login page
3. Click "Sign up" to create an account

### 4. Build for Production

```bash
npm run build
```

This creates optimized files in `frontend/dist/`

---

## Production Deployment

### Backend Production Deployment

#### Option 1: Node.js Server (PM2)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Update Environment**
   ```bash
   cd backend
   nano .env
   ```

   Update:
   ```env
   NODE_ENV=production
   PORT=3001
   # Use production database URI
   # Use production API keys
   ```

3. **Start with PM2**
   ```bash
   pm2 start src/server.js --name streaming-tracker-api
   pm2 save
   pm2 startup
   ```

4. **Monitor**
   ```bash
   pm2 status
   pm2 logs streaming-tracker-api
   ```

#### Option 2: Systemd Service

Create `/etc/systemd/system/streaming-tracker-api.service`:

```ini
[Unit]
Description=Streaming Tracker API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/streaming-tracker/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl start streaming-tracker-api
sudo systemctl enable streaming-tracker-api
```

### Frontend Production Deployment

#### Option 1: Nginx

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Install Nginx**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install nginx
   ```

3. **Configure Nginx**

   Create `/etc/nginx/sites-available/streaming-tracker`:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /path/to/streaming-tracker/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api {
           proxy_pass http://localhost:3001/api;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/streaming-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **SSL with Let's Encrypt (Recommended)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

#### Option 2: Static Hosting (Vercel, Netlify)

**Vercel**:
```bash
npm install -g vercel
cd frontend
vercel
```

**Netlify**:
```bash
npm install -g netlify-cli
cd frontend
netlify deploy --prod --dir=dist
```

Update `frontend/.env` with production API URL.

---

## Docker Deployment

### Complete Docker Setup

The project includes a `docker-compose.yml` for complete deployment.

#### 1. Update Docker Compose

Edit `docker-compose.yml` to ensure environment variables are set:

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5-community
    container_name: streaming-tracker-neo4j
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      NEO4J_AUTH: neo4j/your_secure_password
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: streaming-tracker-backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USERNAME: neo4j
      NEO4J_PASSWORD: your_secure_password
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      TMDB_API_KEY: ${TMDB_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - neo4j
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: streaming-tracker-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  neo4j_data:
  neo4j_logs:
```

#### 2. Create Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

#### 3. Create Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 4. Create Nginx Config for Frontend

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. Deploy with Docker Compose

```bash
# Create .env file for secrets
cat > .env << EOF
JWT_ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
TMDB_API_KEY=your_tmdb_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
EOF

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 6. Run Migrations in Docker

```bash
docker-compose exec backend npm run migrate
```

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Server port |
| `NODE_ENV` | No | development | Environment (development/production) |
| `NEO4J_URI` | Yes | - | Neo4j connection URI |
| `NEO4J_USERNAME` | Yes | - | Neo4j username |
| `NEO4J_PASSWORD` | Yes | - | Neo4j password |
| `JWT_ACCESS_SECRET` | Yes | - | JWT access token secret |
| `JWT_REFRESH_SECRET` | Yes | - | JWT refresh token secret |
| `JWT_ACCESS_EXPIRY` | No | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRY` | No | 7d | Refresh token expiry |
| `TMDB_API_KEY` | Yes | - | TMDB API key |
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic Claude API key |
| `LOG_LEVEL` | No | info | Logging level |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | http://localhost:3001/api | Backend API URL |

---

## Database Migrations

### Running Migrations

The project includes a migration system for Neo4j schema changes.

```bash
cd backend
npm run migrate
```

### Migration Files

Located in `backend/src/database/migrations/`:

- `001-initial-schema.cypher` - Creates initial indexes and constraints

### Creating New Migrations

1. Create a new file in `migrations/` folder:
   ```
   002-your-migration-name.cypher
   ```

2. Add Cypher commands:
   ```cypher
   // Add index
   CREATE INDEX title_name_index IF NOT EXISTS FOR (t:Title) ON (t.name);

   // Add constraint
   CREATE CONSTRAINT service_name_unique IF NOT EXISTS FOR (s:StreamingService) REQUIRE s.name IS UNIQUE;
   ```

3. Run migrations:
   ```bash
   npm run migrate
   ```

---

## Testing Deployment

### Health Check

```bash
# Backend health
curl http://localhost:3001/api/health

# Expected response
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "uptime": ...
  }
}
```

### End-to-End Test

1. **Open Frontend**
   - Navigate to http://localhost:5173 (dev) or http://localhost (prod)

2. **Register New User**
   - Click "Sign up"
   - Fill in: email, username, password
   - Click "Create Account"
   - Should redirect to dashboard

3. **Verify Dashboard**
   - Should show welcome message with username
   - Should show statistics (0 lists, 0 titles, 0 ratings)

4. **Test Recommendations**
   - Click "Recommendations" in nav
   - Click "Get Recommendations"
   - Should show message about needing ratings first

5. **Test Profile**
   - Click "Settings"
   - Update username or email
   - Click "Save Changes"
   - Should show success message

6. **Test Logout**
   - Click "Logout" button
   - Should redirect to login page

7. **Test Login**
   - Enter credentials
   - Click "Sign In"
   - Should redirect to dashboard

### Automated Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

---

## Troubleshooting

### Neo4j Connection Issues

**Error**: `Failed to connect to Neo4j`

**Solutions**:
1. Verify Neo4j is running:
   ```bash
   # Desktop: Check status in Neo4j Desktop
   # Server: sudo systemctl status neo4j
   # Docker: docker ps | grep neo4j
   ```

2. Check credentials in `.env`:
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=correct_password
   ```

3. Test connection:
   ```bash
   cypher-shell -a bolt://localhost:7687 -u neo4j -p your_password
   ```

### Backend Won't Start

**Error**: `Port 3001 already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

**Error**: `TMDB_API_KEY is required`

**Solution**: Ensure `.env` file has valid TMDB API key

### Frontend Build Issues

**Error**: `Cannot find module`

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error**: API calls return 404

**Solution**: Check `VITE_API_URL` in `frontend/.env` points to correct backend URL

### CORS Issues

**Error**: `Access-Control-Allow-Origin` error in browser console

**Solution**: Backend CORS is configured for `http://localhost:5173`. For production, update `backend/src/middleware/cors.middleware.js`:

```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-production-domain.com'  // Add this
  ],
  credentials: true
};
```

### Docker Issues

**Error**: `Cannot connect to Docker daemon`

**Solution**:
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and log back in
```

**Error**: Containers keep restarting

**Solution**: Check logs:
```bash
docker-compose logs backend
docker-compose logs neo4j
```

---

## Maintenance

### Backup Neo4j Database

```bash
# Stop database first
docker-compose stop neo4j

# Backup
docker run --rm \
  -v streaming-tracker_neo4j_data:/data \
  -v $(pwd)/backups:/backups \
  neo4j:5-community \
  neo4j-admin database dump neo4j --to=/backups/neo4j-backup-$(date +%Y%m%d).dump

# Start database
docker-compose start neo4j
```

### Restore Neo4j Database

```bash
docker-compose stop neo4j

docker run --rm \
  -v streaming-tracker_neo4j_data:/data \
  -v $(pwd)/backups:/backups \
  neo4j:5-community \
  neo4j-admin database load neo4j --from=/backups/neo4j-backup-YYYYMMDD.dump

docker-compose start neo4j
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Update backend
cd backend
npm install
npm run migrate  # Run new migrations
pm2 restart streaming-tracker-api

# Update frontend
cd ../frontend
npm install
npm run build
# Copy dist/ to web server
```

### Monitor Application

```bash
# PM2 monitoring
pm2 monit

# Docker monitoring
docker-compose stats

# View logs
pm2 logs streaming-tracker-api
docker-compose logs -f backend
```

### Security Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

---

## Production Checklist

Before deploying to production:

- [ ] Update all API keys and secrets
- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT secrets
- [ ] Configure SSL/HTTPS
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Test all functionality end-to-end
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Review CORS settings
- [ ] Configure domain and DNS
- [ ] Set up automatic updates for security patches
- [ ] Document deployment process for your team
- [ ] Create disaster recovery plan

---

## Support & Resources

- **Project Documentation**: See `README.md`
- **API Documentation**: See `backend/API_DOCUMENTATION.md`
- **Architecture**: See `PLANNING.md`
- **Neo4j Docs**: https://neo4j.com/docs/
- **Express.js Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/

---

## Version History

- **1.0.0** (2026-01-05): Initial deployment documentation

---

*For issues or questions, please refer to the project repository.*
