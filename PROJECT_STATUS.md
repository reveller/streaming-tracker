# Streaming Tracker - Project Status Summary

**Last Updated**: January 5, 2026

## Project Overview

A full-stack streaming watchlist management application that helps users organize TV shows and movies across multiple streaming services. Users can create genre-based list groups and organize titles into Watch Queue, Currently Watching, and Already Watched categories.

## Technology Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: Neo4j (graph database)
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **External APIs**:
  - TMDB (The Movie Database) for title metadata
  - Anthropic Claude API for AI recommendations

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 6
- **Router**: React Router v7
- **Styling**: Tailwind CSS v3.4.0
- **State Management**: React Context API + Custom Hooks
- **Testing**: Jest + React Testing Library

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (serves frontend)
- **Ports**:
  - Frontend: `http://localhost:80`
  - Backend: `http://localhost:3001`
  - Neo4j Browser: `http://localhost:7474`
  - Neo4j Bolt: `bolt://localhost:7687`

## Architecture

### Backend Structure
```
backend/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── controllers/              # Request handlers (15 files)
│   ├── routes/                   # API route definitions
│   ├── middleware/               # Auth, validation, error handling
│   ├── services/                 # Business logic
│   ├── database/
│   │   ├── connection.js         # Neo4j driver setup
│   │   ├── queries/              # Cypher queries (10 files)
│   │   └── migrations/           # Schema migrations
│   ├── models/                   # Data models & schemas
│   ├── utils/                    # Helpers (including neo4j-serializer)
│   └── test/                     # Test utilities
└── tests/                        # Test suites
```

### Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx                  # App entry point
│   ├── App.jsx                   # Root component
│   ├── routes.jsx                # Route configuration
│   ├── pages/                    # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx         # Main dashboard
│   │   ├── ListGroup.jsx         # List detail page
│   │   ├── Recommendations.jsx
│   │   └── Profile.jsx
│   ├── api/                      # API client functions
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication state
│   ├── hooks/
│   │   └── useAuth.js
│   └── styles/
│       └── globals.css           # Tailwind directives
├── tailwind.config.js            # Tailwind v3 config
├── postcss.config.js             # PostCSS config
└── vite.config.js                # Vite config
```

## Database Schema (Neo4j)

### Node Types
- **User**: User accounts with authentication
- **Genre**: Content genres (Action, Comedy, Drama, etc.)
- **ListGroup**: Genre-based collections owned by users
- **Title**: TV shows and movies
- **StreamingService**: Platforms (Netflix, Hulu, etc.)
- **Rating**: User ratings for titles
- **RefreshToken**: For JWT refresh token rotation

### Key Relationships
- `(User)-[:HAS_LIST_GROUP]->(ListGroup)`
- `(ListGroup)-[:FOR_GENRE]->(Genre)`
- `(Title)-[:IN_LIST_GROUP {listType, position}]->(ListGroup)`
- `(Title)-[:AVAILABLE_ON]->(StreamingService)`
- `(User)-[:HAS_RATING]->(Rating)-[:FOR_TITLE]->(Title)`

## Completed Features (Phase 3 & 4)

### Backend (48 API Endpoints)
✅ Authentication & User Management
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/refresh` - Token refresh
- POST `/api/auth/logout` - User logout
- GET `/api/users/me` - Get current user
- PATCH `/api/users/me` - Update user profile

✅ List Group Management
- GET `/api/lists` - Get all user's list groups
- POST `/api/lists` - Create list group
- GET `/api/lists/:id` - Get list group details (with titles & stats)
- DELETE `/api/lists/:id` - Delete list group

✅ Title Management
- POST `/api/lists/:id/titles` - Add title to list
- PATCH `/api/lists/:listGroupId/titles/:titleId` - Move title between lists
- DELETE `/api/lists/:listGroupId/titles/:titleId` - Remove title

✅ Genre & Streaming Service Management
- GET `/api/genres` - Get all genres
- GET `/api/streaming-services` - Get all services

✅ Search & Recommendations
- GET `/api/search` - Search TMDB for titles
- POST `/api/recommendations` - Get AI recommendations

✅ Ratings
- POST `/api/ratings` - Add/update rating
- DELETE `/api/ratings/:titleId` - Delete rating

### Frontend (Core Pages)
✅ Authentication
- Login page with form validation
- Register page with password requirements
- JWT token storage and auto-refresh
- Protected routes with auth guards

✅ Dashboard
- Display user stats (total lists, titles, ratings)
- Show all list groups as clickable cards
- Create new list group modal with genre selection
- Prevent duplicate list groups per genre

✅ List Group Detail Page
- 3-column Kanban layout (Watch Queue, Currently Watching, Already Watched)
- Stats cards showing counts per category
- Display titles in each category
- Delete list group with confirmation modal
- Back navigation to dashboard

✅ Styling
- Tailwind CSS v3 fully configured
- Clean, modern UI with responsive design
- Loading states and error messages
- Modal dialogs with proper UX

## Recent Critical Fixes (Jan 5, 2026)

### Issue 1: Tailwind CSS Not Applied
- **Problem**: Interface looked unstyled despite Tailwind classes
- **Root Cause**: Tailwind v4 configuration incompatibility
- **Fix**: Downgraded to Tailwind v3.4.0, updated postcss.config.js and globals.css

### Issue 2: Neo4j Data Serialization
- **Problem**: API returning Neo4j objects like `{low: 2026, high: 0}` instead of proper values
- **Root Cause**: Missing serialization in list.queries.js
- **Fix**: Added `serializeNeo4jValue()` calls to all query functions in list.queries.js
- **Container Issue**: Required complete container recreation (`docker compose down backend && docker compose up -d backend`) not just rebuild

### Issue 3: Frontend Data Structure Mismatch
- **Problem**: TypeError accessing `watchQueue` on undefined
- **Root Cause**: API response had `titles` nested inside `listGroup` object
- **Fix**: Updated ListGroup.jsx to extract from `response.data.listGroup.titles`

### Issue 4: TMDB Field Name Mismatch
- **Problem**: "Cannot read properties of undefined (reading 'toString')" when adding titles
- **Root Cause**: Backend formats TMDB results and changes field names (id→tmdbId, title→name, etc.)
- **Fix**: Updated frontend ListGroup.jsx to use backend-formatted field names (tmdbId, name, type, posterUrl, releaseYear)

### Issue 5: Neo4j Aggregation Errors
- **Problem**: Backend crashed with "ERR_CONNECTION_RESET" and Neo4j syntax errors about implicit grouping
- **Root Cause**: Queries used `collect()` for some variables but not others in WITH clauses, violating Neo4j aggregation rules
- **Fix**: Updated 4 queries to properly aggregate all variables:
  - `list.queries.js`: `getTitlesByListGroup()` - Changed `rating` to `head(collect(rating))`
  - `title.queries.js`: `getTitleById()`, `searchTitles()`, `getTitlesByUser()` - Same fix
- **Files Modified**: `backend/src/database/queries/list.queries.js`, `backend/src/database/queries/title.queries.js`

## Current Working State

### What's Working ✅
1. User registration and login
2. JWT authentication with refresh tokens
3. Dashboard displays list groups
4. Create new list groups by genre
5. Click list group card to view details
6. List group detail page shows:
   - Genre name
   - Stats (total, watch queue, currently watching, already watched counts)
   - Three columns for organizing titles
   - Delete functionality
7. Neo4j data properly serialized (dates as ISO 8601 strings, integers as numbers)
8. Frontend properly styled with Tailwind CSS
9. **✨ Title Management (NEW!):**
   - Search TMDB for movies and TV shows
   - Add titles directly to any list (Watch Queue, Currently Watching, Already Watched)
   - Move titles between lists with action buttons
   - Remove titles from lists
   - Automatic stats and count updates
   - Poster images and metadata display

### What's Not Implemented Yet ⚠️
1. **Drag & Drop**: Kanban board drag-and-drop functionality planned but not implemented
2. **Recommendations Page**: Backend API works but frontend page is placeholder
3. **Profile/Settings Page**: Backend works but frontend is placeholder
4. **Ratings UI**: Backend API works but no frontend UI
5. **Manual Title Reordering**: Can't change position within same list (no drag-drop yet)

## Environment Variables Required

### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=streamingtracker123
JWT_ACCESS_SECRET=<generate-random-secret>
JWT_REFRESH_SECRET=<generate-random-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
TMDB_API_KEY=<your-tmdb-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
LOG_LEVEL=info
CORS_ORIGIN=http://localhost,http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_URL=/api
```

## Running the Application

### Start All Services
```bash
docker compose up -d
```

### View Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Rebuild After Code Changes
```bash
# Complete rebuild (recommended when code doesn't update)
docker compose down backend
docker compose build backend --no-cache
docker compose up -d backend

# Same for frontend
docker compose down frontend
docker compose build frontend --no-cache
docker compose up -d frontend
```

### Access Points
- Frontend: http://localhost
- Backend API: http://localhost:3001/api
- Backend Health: http://localhost:3001/api/health
- Neo4j Browser: http://localhost:7474

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Known Issues & Gotchas

### Docker Container Caching
**Issue**: Code changes not reflected after `docker compose build`
**Solution**: Use complete container recreation:
```bash
docker compose down <service>
docker compose build <service> --no-cache
docker compose up -d <service>
```

### Browser Caching
**Issue**: Frontend changes not visible
**Solution**: Clear browser cache with "Empty Cache and Hard Reload" (Ctrl+Shift+R in Chrome)

### Neo4j DateTime/Integer Objects
**Issue**: Neo4j returns special objects for DateTime and Integer types
**Solution**: Always use `serializeNeo4jValue()` or `serializeRecords()` from `utils/neo4j-serializer.js` when returning query results

### React Router v7 Engine Warning
**Warning**: "Unsupported engine" for React Router requiring Node 20
**Status**: Non-critical - app works fine on Node 18

## Next Steps / TODO

### High Priority
1. **Title Management UI**: Add modal/form to add titles to lists
2. **Search Integration**: Connect TMDB search to frontend
3. **Move Titles**: UI to move titles between Watch Queue, Currently Watching, Already Watched
4. **Delete Titles**: UI to remove titles from lists

### Medium Priority
5. **Drag & Drop**: Implement Kanban board drag-and-drop functionality
6. **Recommendations Page**: Build UI for AI-powered recommendations
7. **Profile/Settings Page**: Complete user profile management UI
8. **Ratings UI**: Add star ratings to title cards

### Low Priority
9. **Error Handling**: Improve error messages and user feedback
10. **Loading States**: Better loading indicators throughout app
11. **Responsive Design**: Mobile optimization
12. **Unit Tests**: Increase test coverage for new features

## Code Style & Conventions

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JavaScript
- **Line Length**: Max 500 lines per file (enforced by CLAUDE.md)
- **Documentation**: JSDoc comments for all functions
- **Imports**: Relative paths within packages
- **Error Handling**: Try-catch with proper error responses
- **Validation**: Joi schemas for all API inputs

## Important Files to Review When Starting New Session

1. **PLANNING.md** - Complete architecture and design document
2. **TASK.md** - Task tracking and completion log
3. **CLAUDE.md** - AI behavior rules and project guidelines
4. **backend/API_DOCUMENTATION.md** - Complete API reference (48 endpoints)
5. **backend/src/database/queries/list.queries.js** - List group data access layer
6. **frontend/src/pages/ListGroup.jsx** - List detail page component
7. **frontend/src/routes.jsx** - Application routing configuration

## Quick Reference Commands

```bash
# View running containers
docker ps

# View all tasks/agents
/tasks

# Restart everything
docker compose restart

# Check backend API
curl http://localhost:3001/api/health

# View Neo4j data
# Open http://localhost:7474 and run:
MATCH (n) RETURN n LIMIT 25

# Grep for code patterns
grep -r "serializeNeo4jValue" backend/src/

# Find files
find . -name "*.jsx" -type f
```

## Latest Session Accomplishments (Jan 5, 2026)

### Title Management Implementation ✅
Successfully implemented complete title management functionality:

**Frontend Changes:**
- Added "+ Add Title" button to ListGroup page header
- Created search modal with TMDB integration
- Implemented `handleSearch()` to query TMDB multi-search
- Implemented `handleAddTitle()` to create titles and add to lists
- Implemented `handleMoveTitle()` to move titles between Watch Queue, Currently Watching, Already Watched
- Implemented `handleRemoveTitle()` to delete titles from lists
- Added action buttons to each title card based on its current list
- Display poster images, release years, and descriptions from TMDB

**Backend Fixes:**
- Fixed Neo4j aggregation errors in 4 database queries
- Added proper `head(collect(rating))` aggregation for rating relationships
- Fixed serialization in `getTitleById()` query

**Files Modified:**
- `frontend/src/pages/ListGroup.jsx` - Complete title management UI
- `backend/src/database/queries/list.queries.js` - Fixed `getTitlesByListGroup()`
- `backend/src/database/queries/title.queries.js` - Fixed `getTitleById()`, `searchTitles()`, `getTitlesByUser()`

**User Testing Confirmed:**
- ✅ Can add titles to Watch Queue, Currently Watching, Already Watched
- ✅ Can move titles between lists using action buttons
- ✅ Can remove titles from lists
- ✅ Stats update automatically after each action
- ✅ TMDB search returns results with poster images
- ✅ All functionality working without errors

## Session Handoff Notes

**Current State**: Application is now **fully functional** for core watchlist management! Users can create list groups, search for titles via TMDB, add them to lists, move them between categories, and remove them. The app is now genuinely useful.

**Next Priority**:
1. **Drag & Drop** - Implement react-beautiful-dnd or dnd-kit for Kanban-style drag and drop
2. **Ratings UI** - Add star rating component to title cards
3. **Recommendations Page** - Build UI for AI-powered recommendations
4. **Profile/Settings** - Complete user profile management UI

**Container Management Tip**: If code changes don't appear after rebuild, always do full container recreation with `down` + `up -d`, not just `restart`.

**Neo4j Aggregation Rule**: When using `OPTIONAL MATCH` with `collect()`, ALL variables in the WITH clause must be either:
1. Explicitly in the grouping key (before the aggregation)
2. Inside an aggregation function like `collect()` or `head(collect())`

**Serialization Pattern**: All Neo4j query functions must wrap results in `serializeNeo4jValue()` or `serializeRecords()` before returning. This is critical for frontend consumption.
