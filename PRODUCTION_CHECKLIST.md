# Production Deployment Checklist

Use this checklist to ensure your Streaming Tracker deployment is production-ready.

## Pre-Deployment

### Security

- [ ] **JWT Secrets**: Generated cryptographically secure random secrets (64 bytes)
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

- [ ] **Neo4j Password**: Changed from default to strong password (20+ characters)
  - [ ] Contains uppercase, lowercase, numbers, and special characters
  - [ ] Not stored in version control

- [ ] **API Keys**: Valid and production-ready
  - [ ] TMDB API key configured
  - [ ] Anthropic API key configured with appropriate rate limits

- [ ] **Environment Variables**: All secrets stored securely
  - [ ] `.env` file not committed to git
  - [ ] `.env` file has correct permissions (chmod 600)

- [ ] **CORS Configuration**: Updated for production domain
  - [ ] Edit `backend/src/middleware/cors.middleware.js`
  - [ ] Add production frontend URL to allowed origins

### Infrastructure

- [ ] **Domain Name**: Registered and configured
  - [ ] DNS A record pointing to server IP
  - [ ] DNS propagated (check with `nslookup your-domain.com`)

- [ ] **SSL Certificate**: Configured for HTTPS
  - [ ] Certificate obtained (Let's Encrypt recommended)
  - [ ] Auto-renewal configured

- [ ] **Server Resources**: Adequate for expected load
  - [ ] Minimum 2GB RAM
  - [ ] Minimum 2 CPU cores
  - [ ] Minimum 20GB storage

- [ ] **Firewall**: Configured properly
  - [ ] Port 80 (HTTP) open
  - [ ] Port 443 (HTTPS) open
  - [ ] Port 7474 (Neo4j Browser) restricted or closed
  - [ ] Port 7687 (Neo4j Bolt) restricted to localhost only
  - [ ] Port 3001 (Backend API) restricted to localhost only

### Database

- [ ] **Neo4j Configuration**: Production-ready
  - [ ] Memory settings appropriate for data size
  - [ ] Indexes created (run migrations)
  - [ ] Constraints configured

- [ ] **Backup Strategy**: Automated backups configured
  - [ ] Daily automated backups scheduled
  - [ ] Backup retention policy defined
  - [ ] Backup restoration tested

### Application

- [ ] **Environment**: Set to production
  - [ ] `NODE_ENV=production` in backend
  - [ ] Production build of frontend created

- [ ] **Error Handling**: Comprehensive
  - [ ] Error tracking configured (e.g., Sentry)
  - [ ] Log aggregation set up

- [ ] **Rate Limiting**: Configured appropriately
  - [ ] Auth endpoints: 10 requests per 15 minutes
  - [ ] General endpoints: 100 requests per 15 minutes

## Deployment

### Docker Deployment

- [ ] **Docker Installed**: Latest stable version
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] **Environment File**: Created and configured
  ```bash
  cp .env.example .env
  # Edit .env with production values
  ```

- [ ] **Build Images**: Successfully built
  ```bash
  docker-compose build
  ```

- [ ] **Start Services**: All containers running
  ```bash
  docker-compose up -d
  ```

- [ ] **Health Checks**: All passing
  ```bash
  docker-compose ps
  # All services should show "healthy" or "Up"
  ```

- [ ] **Run Migrations**: Database schema created
  ```bash
  docker-compose exec backend npm run migrate
  ```

### Traditional Deployment

- [ ] **Dependencies Installed**: All npm packages
  ```bash
  cd backend && npm install --production
  cd frontend && npm install
  ```

- [ ] **Frontend Built**: Production build created
  ```bash
  cd frontend && npm run build
  ```

- [ ] **Process Manager**: PM2 or systemd configured
  - [ ] Backend service running
  - [ ] Auto-restart on failure configured
  - [ ] Auto-start on boot configured

- [ ] **Web Server**: Nginx or Apache configured
  - [ ] Static files served from frontend/dist
  - [ ] API proxy configured
  - [ ] Gzip compression enabled
  - [ ] SSL/TLS configured

## Post-Deployment

### Testing

- [ ] **Frontend Access**: Homepage loads successfully
  - [ ] Visit https://your-domain.com
  - [ ] No console errors in browser dev tools

- [ ] **Backend Health**: API responding
  ```bash
  curl https://your-domain.com/api/health
  ```

- [ ] **User Registration**: Can create new account
  - [ ] Register form works
  - [ ] Email validation works
  - [ ] Password requirements enforced
  - [ ] User receives tokens
  - [ ] Redirected to dashboard

- [ ] **User Login**: Can authenticate
  - [ ] Login form works
  - [ ] Invalid credentials rejected
  - [ ] Valid credentials accepted
  - [ ] JWT tokens stored

- [ ] **Dashboard**: Displays correctly
  - [ ] User statistics shown
  - [ ] Navigation works
  - [ ] No errors in console

- [ ] **Recommendations**: AI integration works
  - [ ] Can request recommendations
  - [ ] Claude API responding
  - [ ] Results display correctly

- [ ] **Profile Management**: Updates work
  - [ ] Can update email
  - [ ] Can update username
  - [ ] Can change password
  - [ ] Can logout

### Monitoring

- [ ] **Logging**: Centralized and accessible
  - [ ] Application logs collected
  - [ ] Error logs monitored
  - [ ] Access logs reviewed

- [ ] **Performance Monitoring**: Metrics tracked
  - [ ] Response times measured
  - [ ] Error rates tracked
  - [ ] Database performance monitored

- [ ] **Uptime Monitoring**: Service availability tracked
  - [ ] Uptime monitor configured (e.g., UptimeRobot)
  - [ ] Alerts configured for downtime

- [ ] **Resource Monitoring**: Server resources tracked
  - [ ] CPU usage monitored
  - [ ] Memory usage monitored
  - [ ] Disk space monitored

### Security

- [ ] **HTTPS Enforced**: All traffic encrypted
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS header configured

- [ ] **Security Headers**: Properly configured
  - [ ] X-Frame-Options set
  - [ ] X-Content-Type-Options set
  - [ ] X-XSS-Protection set
  - [ ] Content-Security-Policy considered

- [ ] **Database Access**: Properly restricted
  - [ ] Neo4j not publicly accessible
  - [ ] Strong password enforced
  - [ ] Regular security updates applied

- [ ] **API Security**: Rate limiting active
  - [ ] Test rate limits work
  - [ ] Monitor for abuse

### Backup & Recovery

- [ ] **Initial Backup**: Created and verified
  ```bash
  ./deploy.sh backup
  ```

- [ ] **Backup Schedule**: Automated backups running
  - [ ] Cron job or scheduled task configured
  - [ ] Backups stored off-server

- [ ] **Recovery Test**: Restoration verified
  - [ ] Test database restore on staging
  - [ ] Document recovery procedures

### Documentation

- [ ] **Runbook Created**: Operations documented
  - [ ] Deployment procedures
  - [ ] Backup/restore procedures
  - [ ] Troubleshooting guide
  - [ ] Contact information for support

- [ ] **User Documentation**: Available
  - [ ] User guide created
  - [ ] FAQ documented
  - [ ] Support contact provided

## Ongoing Maintenance

### Weekly

- [ ] Review error logs
- [ ] Check backup success
- [ ] Monitor disk space

### Monthly

- [ ] Review security updates
- [ ] Update dependencies
- [ ] Test backup restoration
- [ ] Review performance metrics

### Quarterly

- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Disaster recovery test

## Emergency Contacts

Fill in your emergency contact information:

- **System Administrator**: _________________
- **Database Administrator**: _________________
- **DevOps/Infrastructure**: _________________
- **Application Support**: _________________

## Rollback Plan

If deployment fails:

1. **Stop Services**:
   ```bash
   docker-compose down
   # or
   pm2 stop streaming-tracker-api
   sudo systemctl stop nginx
   ```

2. **Restore Previous Version**:
   ```bash
   git checkout <previous-tag>
   docker-compose up -d
   ```

3. **Restore Database Backup**:
   ```bash
   # See DEPLOYMENT.md for restore instructions
   ```

4. **Verify Services**:
   - Test health endpoints
   - Check user login
   - Verify core functionality

5. **Investigate Issues**:
   - Review logs
   - Document problems
   - Plan fixes for next deployment

## Sign-Off

- [ ] **Deployed By**: _________________ Date: _________
- [ ] **Reviewed By**: _________________ Date: _________
- [ ] **Approved By**: _________________ Date: _________

---

## Notes

Use this space for deployment-specific notes:

```
Deployment Date: _______________
Version: _______________
Special Configurations: _______________
Known Issues: _______________
```
