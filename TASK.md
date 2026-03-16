# Streaming Tracker - Task Tracking

**Project Start Date**: 2026-01-04
**Current Phase**: Phase 6 - Polish & Deploy (Live on AWS Lightsail)
**Last Updated**: 2026-03-16

---

## Recent Progress Summary

### Completed - 2026-03-16

**Structured Logging System:**
- ✅ Winston logger with JSON structured logging and daily file rotation
- ✅ Dedicated audit log for security events (90-day retention)
- ✅ Auth events: login success/failure, account lockouts, password changes/resets
- ✅ Invitation events: sent, redeemed, deleted
- ✅ AI recommendation requests logged with genre and result count
- ✅ HTTP request middleware logging (method, path, status, duration)
- ✅ Replaced all console.log/error across controllers, middleware, server
- ✅ Docker volume (`backend_logs`) for log persistence across rebuilds

**Deployment Config Captured in Repo:**
- ✅ `deploy/nginx/tracker.n2deep.co` — Host nginx reverse proxy config
- ✅ `deploy/nginx/vocab.n2deep.co` — Host nginx reverse proxy for vocab app
- ✅ `deploy/certbot-renew.cron` — SSL auto-renewal (installed on instance, runs daily 3 AM UTC)
- ✅ `docker-compose.cloud.yml` — Cloud overrides (Neo4j memory, CORS, port 8080, AWS creds)
- ✅ `.env.example` updated with AWS credential placeholders
- ✅ SSL cert expires 2026-06-13, auto-renewal active

**Recommendations Page Enhancements:**
- ✅ 5-star rating above Done button (saves rating when adding to Already Watched)
- ✅ Slide-out animation when action button clicked (card slides left, remaining rotate up)
- ✅ Streaming service selector dropdown on each recommendation card
- ✅ Service linked to title when added to list

**Add Title Modal Enhancements:**
- ✅ Same slide-out animation on search results when title is added

**CLOUD-DEPLOY.md Updates:**
- ✅ Invitation system & AWS SES documentation
- ✅ SES sandbox verification commands (`aws ses verify-email-identity`)
- ✅ Security features section (account lockout, password reset)
- ✅ Deploying updates section (standard, no-cache, env vars, API keys)
- ✅ Application logs section (log files, audit events, viewing commands)
- ✅ Spanish Vocab app deployment docs (added by user)

### Completed - 2026-03-15

**Security Features:**
- ✅ Account lockout: 5 failed attempts → 10-minute lock (stored in Neo4j)
- ✅ Forgot password flow via AWS SES email with time-limited reset tokens
- ✅ Reset tokens SHA-256 hashed before storage, 15-minute expiry
- ✅ Email enumeration prevention (always returns 200 on forgot password)

**Invitation System (Full Stack):**
- ✅ Admin-only invitation creation with email via AWS SES
- ✅ Token-based registration flow (invitation link → register page)
- ✅ Invitation history with delete capability (trash icon)
- ✅ Open registration disabled (invitation-only)
- ✅ Admin middleware and role-based access control

**AI Recommendations (Full Stack):**
- ✅ Anthropic Claude API integration (claude-sonnet-4-6)
- ✅ TMDB enrichment on backend (posters, tmdbId for each recommendation)
- ✅ Existing user titles excluded from recommendations
- ✅ Contextual access from list pages (auto-targets genre and list group)
- ✅ Queue/Watch/Done action buttons on each recommendation
- ✅ Removed standalone Recommendations nav link (accessed from list pages)

**Cloud Deployment:**
- ✅ AWS Lightsail instance (Ubuntu 22.04, 2 vCPU, 2GB RAM)
- ✅ Docker Compose with 3 containers (Neo4j, backend, frontend)
- ✅ Host nginx reverse proxy with Let's Encrypt SSL
- ✅ Domain: tracker.n2deep.co
- ✅ Spanish Vocab app co-hosted at vocab.n2deep.co

### Completed - 2026-03-02

**List Page Features:**
- ✅ Streaming service filter dropdown (filter titles by service)
- ✅ Show type filter (All/Movies/Series)
- ✅ Filters can be combined
- ✅ Drag-and-drop title reordering within lists

### Completed - 2026-01-05

**Phase 4 UI Enhancements:**
- ✅ 5-star rating system on all title cards
- ✅ Poster thumbnails, clickable title names (TMDB links)
- ✅ Horizontal card layout with action buttons

### Completed - 2026-01-04

**Phase 1-3 (Full Stack Foundation):**
- ✅ 48+ RESTful API endpoints
- ✅ JWT authentication (access + refresh tokens)
- ✅ Neo4j graph database
- ✅ TMDB API integration
- ✅ React + Vite + Tailwind CSS v3 frontend
- ✅ Docker Compose orchestration

---

## Current Status by Phase

### Phase 1: Foundation & Setup ✅ COMPLETE
### Phase 2: Backend Core ✅ COMPLETE
### Phase 3: Frontend Core ✅ COMPLETE
### Phase 4: Main Features ✅ COMPLETE
- List management, search, ratings, drag-and-drop, filtering
### Phase 5: AI Integration ✅ COMPLETE
- Claude API recommendations with TMDB enrichment, contextual access from lists
### Phase 6: Polish & Deploy ✅ LARGELY COMPLETE
- Live on AWS Lightsail with SSL, structured logging, security features
- Invitation-only registration, password reset flow

---

## Pending / Future Work

### Technical Debt
- 📋 Update comprehensive README with full setup instructions
- 📋 Add E2E tests with Playwright/Cypress
- 📋 Upgrade Docker base images from Node 18 to Node 20 (resolves EBADENGINE warnings)
- 📋 Move from SES sandbox to production (request production access in AWS console)

### Feature Ideas
- 📋 CloudWatch log shipping and alerts (Option 2 from logging discussion)
- 📋 Loading states and error boundaries
- 📋 Performance optimization
- 📋 Accessibility improvements

---

## Key Architecture

- **Branch**: `cloud-deploy` (deployed), `main` (local-only version)
- **Domain**: tracker.n2deep.co (+ vocab.n2deep.co for Spanish Vocab app)
- **Stack**: Node.js/Express, React/Vite, Neo4j, Docker Compose
- **APIs**: TMDB (metadata), Anthropic Claude (recommendations), AWS SES (email)
- **Auth**: JWT with account lockout, invitation-only registration, password reset
- **Logging**: Winston with daily rotation — `app-*.log` (30d) + `audit-*.log` (90d)
- **SSL**: Let's Encrypt with auto-renewal cron (daily 3 AM UTC)

---

**Document Version**: 3.0
**Last Updated**: 2026-03-16
