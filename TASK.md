# Streaming Tracker - Task Tracking

**Project Start Date**: 2026-01-04
**Current Phase**: Phase 6 - Polish & Deploy (Live on AWS Lightsail)
**Last Updated**: 2026-04-28

---

## Recent Progress Summary

### Completed - 2026-04-28

**Nginx Hardening — Allowlist Model:**
- ✅ Switched SPA fallback from blanket `try_files ... /index.html` to extensionless-paths-only
- ✅ Probe paths (config files, source maps, archives, WP/Actuator/n8n endpoints) now return 404 instead of SPA shell — removes the 200-response signal that was fueling repeat scanner traffic
- ✅ Broadened deny rules to cover patterns observed in log analysis: `*.yml/yaml/toml/ini/conf/tfvars/tfstate`, `*.zip/tar/gz/7z`, `*.py/rb/pl/sh/jar`, `*.map`, `*.json/xml` outside `/api`, plus `/actuator/`, `/_profiler`, `/_debug`, `/rest/workflows`, `/wp-json/`, `/ueditor/`, `/systembc/`, etc.
- ✅ Verified: 130 of 212 daily probe responses flipped from 200 → 404; all legit SPA routes still serve

### Completed - 2026-03-17 (continued)

**AI Recommendations — Context Scoping:**
- ✅ Recommendations now scoped to current list group's Already Watched queue only (no cross-genre bleed)
- ✅ New `getRatingsByListGroup` and `getListGroupRatingStats` queries filter by listGroupId + ALREADY_WATCHED
- ✅ `listGroupId` passed from frontend through API to recommendation service

**List Page Enhancements:**
- ✅ Title name search/filter on genre pages (case-insensitive substring match, X to clear)

**Infrastructure:**
- ✅ Upgraded Docker base images from Node 18 (EOL) to Node 20 (LTS)

### Completed - 2026-03-17

**AI Recommendations — Major Refactor:**
- ✅ Persistent AI guidance textarea per list group (stored in Neo4j, auto-saves on blur)
- ✅ Recommendations no longer auto-fetch on page load (user clicks button)
- ✅ Dismissed recommendations list (FIFO, max 100) — unadded titles excluded from future results
- ✅ Refactored Claude API call to use `tool_use` for structured output (eliminates JSON parsing issues, self-correction leakage, code fence problems)
- ✅ System prompt + user message separation (replaces single unstructured prompt)
- ✅ TMDB verification — hallucinated titles filtered out (must have valid tmdbId)
- ✅ TMDB ID dedup — titles already in user's lists filtered by tmdbId, not just name matching
- ✅ Claude suggests streaming service per recommendation (auto-selects dropdown when matched)
- ✅ Diagnostic logging for recommendation filtering pipeline
- ✅ Request buffer (+5 extra titles) to compensate for filtered results

**Bug Fixes:**
- ✅ Fixed `instanceof` crash: re-exported ValidationError/NotFoundError from title.service.js
- ✅ Fixed null posterUrl rejection when creating titles without TMDB posters
- ✅ Increased general rate limit from 100 to 300 requests per 15 minutes

**UI Changes:**
- ✅ Renamed "Username" label to "Nickname" on Register and Profile pages
- ✅ Removed Spanish Vocab app references from CLOUD-DEPLOY.md, TASK.md, and deploy/nginx/

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
- ✅ Upgrade Docker base images from Node 18 to Node 20 (resolves EBADENGINE warnings)
- 📋 Move from SES sandbox to production (request production access in AWS console)

### Feature Ideas
- 📋 Route 53 health check + SNS email alert for downtime notification (~$1/month)
- 📋 CloudWatch log shipping and alerts (Option 2 from logging discussion)
- 📋 Loading states and error boundaries
- 📋 Performance optimization
- 📋 Accessibility improvements

---

## Key Architecture

- **Branch**: `cloud-deploy` (deployed), `main` (local-only version)
- **Domain**: tracker.n2deep.co
- **Stack**: Node.js/Express, React/Vite, Neo4j, Docker Compose
- **APIs**: TMDB (metadata), Anthropic Claude via tool_use (recommendations), AWS SES (email)
- **Auth**: JWT with account lockout, invitation-only registration, password reset
- **Logging**: Winston with daily rotation — `app-*.log` (30d) + `audit-*.log` (90d)
- **SSL**: Let's Encrypt with auto-renewal cron (daily 3 AM UTC)

---

**Document Version**: 3.3
**Last Updated**: 2026-04-28
