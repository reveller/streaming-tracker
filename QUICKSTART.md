# Quick Start Guide - Streaming Tracker

Get up and running with Streaming Tracker in minutes!

## Prerequisites

- Docker and Docker Compose installed ([Get Docker](https://www.docker.com/get-started))
- TMDB API Key ([Get Free API Key](https://www.themoviedb.org/settings/api))
- Anthropic API Key ([Get API Key](https://console.anthropic.com/))

## 5-Minute Setup (Docker)

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd streaming-tracker
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your favorite editor
nano .env  # or vim, code, etc.
```

Add your API keys to the `.env` file:

```env
NEO4J_PASSWORD=change_this_to_secure_password
JWT_ACCESS_SECRET=will_be_generated_automatically
JWT_REFRESH_SECRET=will_be_generated_automatically
TMDB_API_KEY=your_tmdb_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Deploy

**On Linux/Mac:**
```bash
./deploy.sh
```

**On Windows (PowerShell):**
```powershell
.\deploy.ps1
```

That's it! The script will:
- Generate secure JWT secrets
- Build Docker images
- Start all services (Neo4j, Backend, Frontend)
- Run database migrations
- Display access URLs

### 4. Access the Application

Open your browser and visit:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api
- **Neo4j Browser**: http://localhost:7474 (optional, for database inspection)

## First Steps

1. **Create an Account**
   - Click "Sign up" on the login page
   - Enter email, username, and password (8+ characters)
   - Click "Create Account"

2. **Explore the Dashboard**
   - View your statistics (initially all zeros)
   - See list groups (initially empty)

3. **Get AI Recommendations**
   - Click "Recommendations" in the navigation
   - Set recommendation count (1-10)
   - Click "Get Recommendations"
   - Note: You'll get better recommendations after rating some titles!

4. **Update Your Profile**
   - Click "Settings" in the navigation
   - Update email or username in the "Profile" tab
   - Change password in the "Password" tab

## Common Commands

```bash
# View logs
./deploy.sh logs

# Check service status
./deploy.sh status

# Restart services
./deploy.sh restart

# Stop everything
./deploy.sh down

# Create database backup
./deploy.sh backup
```

## Manual Setup (Without Docker)

If you prefer not to use Docker:

### 1. Install Neo4j

Download from https://neo4j.com/download/ and follow installation instructions.

**Start Neo4j:**
```bash
neo4j start
```

**Set password:**
- Open http://localhost:7474
- Login with `neo4j/neo4j`
- Set new password when prompted

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and API credentials

# Run migrations
npm run migrate

# Start server
npm start
```

Backend runs on http://localhost:3001

### 3. Setup Frontend

**In a new terminal:**

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with backend URL (http://localhost:3001/api)

# Start development server
npm run dev
```

Frontend runs on http://localhost:5173

### 4. Create Production Build

```bash
cd frontend
npm run build

# Serve with your favorite web server
# Files are in: frontend/dist/
```

## Troubleshooting

### Docker Issues

**Services won't start:**
```bash
# Check Docker is running
docker ps

# View service logs
./deploy.sh logs

# Clean and restart
./deploy.sh clean
./deploy.sh up
```

**Port already in use:**
```bash
# Change ports in docker-compose.yml
# For example, change "80:80" to "8080:80" for frontend
```

### Connection Issues

**Can't connect to API:**
1. Check backend is running: `curl http://localhost:3001/api/health`
2. Check CORS settings in `backend/src/middleware/cors.middleware.js`
3. Verify `VITE_API_URL` in `frontend/.env`

**Can't connect to Neo4j:**
1. Verify Neo4j is running
2. Check credentials in `backend/.env`
3. Test connection: `cypher-shell -a bolt://localhost:7687 -u neo4j -p your_password`

### API Key Issues

**TMDB API errors:**
- Verify key at https://www.themoviedb.org/settings/api
- Ensure key has proper permissions
- Check rate limits

**Anthropic API errors:**
- Verify key at https://console.anthropic.com/
- Check billing/credits
- Ensure you're using the correct model (claude-3-5-sonnet-20241022)

## Next Steps

Now that you're up and running:

1. **Read the Full Documentation**
   - `DEPLOYMENT.md` - Complete deployment guide
   - `backend/API_DOCUMENTATION.md` - API reference
   - `PLANNING.md` - Architecture overview

2. **Check Production Checklist**
   - See `PRODUCTION_CHECKLIST.md` before deploying to production

3. **Explore Advanced Features**
   - Set up Kanban boards (coming soon)
   - Integrate TMDB search (coming soon)
   - Configure rating UI (coming soon)

## Getting Help

- **Documentation**: Check the docs in the repository
- **Issues**: Report bugs on GitHub
- **API Docs**: See `backend/API_DOCUMENTATION.md`

## Stopping the Application

**Docker:**
```bash
./deploy.sh down
```

**Manual:**
```bash
# Stop backend (Ctrl+C in terminal)
# Stop frontend (Ctrl+C in terminal)
# Stop Neo4j
neo4j stop
```

---

**Enjoy using Streaming Tracker!** 🎬
