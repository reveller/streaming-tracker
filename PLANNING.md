# Streaming Tracker - Planning & Architecture

**Created**: 2026-01-04
**Last Updated**: 2026-01-04
**Project Status**: Phase 1 - Foundation & Setup

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Frontend Architecture](#frontend-architecture)
7. [Code Organization](#code-organization)
8. [Development Conventions](#development-conventions)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Strategy](#deployment-strategy)

---

## Project Overview

**Streaming Tracker** is a web-based application for managing, tracking, and organizing movies and TV series across multiple streaming services (Netflix, Disney+, Hulu, Amazon Prime, HBO/Max, etc.).

### Core Features

- **Three-List System**: Watch Queue → Currently Watching → Already Watched
- **Multi-Service Support**: Track content across multiple streaming platforms
- **Genre-Based Organization**: Create list groups organized by genres
- **5-Star Rating System**: Rate watched content
- **AI-Powered Recommendations**: Get personalized recommendations based on ratings
- **Kanban-Style Interface**: Drag-and-drop titles between lists
- **TMDB Integration**: Search and add titles with metadata
- **Multi-User Support**: JWT authentication with user data isolation

### Project Goals

1. Provide an intuitive interface for tracking streaming content
2. Scale to handle thousands of titles per user
3. Deliver personalized AI recommendations
4. Maintain clean, modular, maintainable code
5. Ensure comprehensive test coverage

---

## Technology Stack

### Confirmed Decisions (2026-01-04)

**Backend**
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js 4.x
- **Database**: Neo4j 5.x (graph database)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi or Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **External APIs**:
  - TMDB (The Movie Database) - Title metadata
  - Anthropic Claude API - AI recommendations

**Frontend**
- **Framework**: React 18+
- **Build Tool**: Vite 5+
- **Routing**: React Router 6+
- **State Management**: Context API + Custom Hooks
- **HTTP Client**: Axios
- **Drag & Drop**: @dnd-kit/core
- **Data Fetching/Caching**: React Query or SWR
- **Styling**: CSS Modules (or Tailwind CSS if preferred)
- **Testing**: React Testing Library + Jest

**DevOps**
- **Containerization**: Docker + Docker Compose
- **Version Control**: Git
- **CI/CD**: GitHub Actions (optional)
- **Environment Management**: dotenv

---

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────┐
│   React Frontend    │
│   (Vite + React)    │
└──────┬──────────────┘
       │ REST API
       ▼
┌─────────────────────┐
│  Express Backend    │
│  - Auth Middleware  │
│  - Controllers      │
│  - Services         │
└──────┬──────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌────────────┐   ┌──────────────┐
│   Neo4j    │   │ External APIs│
│  Database  │   │ - TMDB       │
│            │   │ - Claude API │
└────────────┘   └──────────────┘
```

### Backend Architecture Layers

```
Routes → Controllers → Services → Database Queries
   ↓         ↓           ↓             ↓
Routing   Request    Business      Neo4j
Logic     Handling   Logic         Cypher
```

**Layer Responsibilities:**
- **Routes**: Define endpoints and HTTP methods
- **Controllers**: Handle HTTP requests/responses, call services
- **Services**: Business logic, external API calls
- **Database Queries**: Neo4j Cypher query execution

### Frontend Architecture Pattern

```
Pages → Hooks → Context → API Layer → Backend
  ↓       ↓        ↓          ↓
 UI    Logic   State    HTTP Calls
```

**Component Organization:**
- **Pages**: Route-level components
- **Components**: Reusable UI components (organized by feature)
- **Hooks**: Custom hooks for data fetching and business logic
- **Context**: Global state management
- **API**: Axios client and API call functions

---

## Database Schema

### Neo4j Graph Structure

#### Node Types

**User Node**
```cypher
(:User {
  id: String (UUID),
  email: String (unique),
  username: String (unique),
  passwordHash: String,
  createdAt: DateTime,
  updatedAt: DateTime,
  lastLoginAt: DateTime
})
```

**ListGroup Node** (represents 3-list system for a genre group)
```cypher
(:ListGroup {
  id: String (UUID),
  name: String,
  mediaType: String, // "movies" | "series" | "all"
  createdAt: DateTime,
  updatedAt: DateTime
})
```

**Genre Node**
```cypher
(:Genre {
  id: String (UUID),
  name: String (unique),
  description: String,
  createdAt: DateTime
})
```

**StreamingService Node**
```cypher
(:StreamingService {
  id: String (UUID),
  name: String (unique),
  logoUrl: String,
  baseUrl: String,
  isActive: Boolean,
  createdAt: DateTime
})
```

**Title Node**
```cypher
(:Title {
  id: String (UUID),
  tmdbId: String (unique),
  title: String,
  type: String, // "movie" | "series"
  year: Integer,
  synopsis: String,
  posterUrl: String,
  backdropUrl: String,
  runtime: Integer,
  releaseDate: Date,
  createdAt: DateTime,
  updatedAt: DateTime
})
```

**Rating Node**
```cypher
(:Rating {
  id: String (UUID),
  stars: Integer, // 1-5
  review: String (optional),
  createdAt: DateTime,
  updatedAt: DateTime
})
```

#### Relationships

```cypher
// User owns ListGroups
(:User)-[:OWNS]->(:ListGroup)

// ListGroup belongs to Genres
(:ListGroup)-[:INCLUDES_GENRE]->(:Genre)

// ListGroup has access to StreamingServices
(:ListGroup)-[:HAS_ACCESS_TO]->(:StreamingService)

// Title in different list states
(:Title)-[:IN_WATCH_QUEUE {addedAt: DateTime, position: Integer}]->(:ListGroup)
(:Title)-[:CURRENTLY_WATCHING {startedAt: DateTime, position: Integer}]->(:ListGroup)
(:Title)-[:ALREADY_WATCHED {watchedAt: DateTime, position: Integer}]->(:ListGroup)

// Title available on StreamingService
(:Title)-[:AVAILABLE_ON]->(:StreamingService)

// Title belongs to Genres
(:Title)-[:BELONGS_TO_GENRE]->(:Genre)

// User rates Title
(:User)-[:RATED]->(:Rating)-[:FOR_TITLE]->(:Title)
```

#### Constraints & Indexes

```cypher
// Constraints (uniqueness)
CREATE CONSTRAINT user_email_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

CREATE CONSTRAINT user_username_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.username IS UNIQUE;

CREATE CONSTRAINT genre_name_unique IF NOT EXISTS
FOR (g:Genre) REQUIRE g.name IS UNIQUE;

CREATE CONSTRAINT service_name_unique IF NOT EXISTS
FOR (s:StreamingService) REQUIRE s.name IS UNIQUE;

CREATE CONSTRAINT title_tmdb_unique IF NOT EXISTS
FOR (t:Title) REQUIRE t.tmdbId IS UNIQUE;

// Indexes (performance)
CREATE INDEX title_type IF NOT EXISTS
FOR (t:Title) ON (t.type);

CREATE INDEX listgroup_user IF NOT EXISTS
FOR ()-[r:OWNS]-() ON (r.userId);

CREATE INDEX rating_stars IF NOT EXISTS
FOR (r:Rating) ON (r.stars);
```

---

## API Design

### REST API Endpoints

Base URL: `/api`

#### Authentication (5 endpoints)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT
- `POST /auth/logout` - Logout (invalidate token)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

#### Lists (5 endpoints)

- `GET /lists` - Get all lists for user (paginated)
- `POST /lists` - Create new list group
- `GET /lists/:id` - Get single list with all titles
- `PATCH /lists/:id` - Update list configuration
- `DELETE /lists/:id` - Delete list

#### Titles (5 endpoints)

- `GET /titles/search?q=query&type=movie` - Search TMDB
- `POST /lists/:listId/titles` - Add title to list
- `PATCH /titles/:titleId/move` - Move title between lists
- `DELETE /lists/:listId/titles/:titleId` - Remove title
- `GET /titles/:titleId` - Get title details

#### Ratings (4 endpoints)

- `POST /titles/:titleId/ratings` - Create rating
- `PATCH /ratings/:ratingId` - Update rating
- `DELETE /ratings/:ratingId` - Delete rating
- `GET /ratings/stats` - Get user rating statistics

#### Genres (3 endpoints)

- `GET /genres` - Get all genres
- `POST /genres` - Create genre
- `DELETE /genres/:genreId` - Delete genre

#### Services (4 endpoints)

- `GET /services` - Get all streaming services
- `POST /services` - Create service
- `PATCH /services/:serviceId` - Update service
- `DELETE /services/:serviceId` - Delete service

#### Recommendations (2 endpoints)

- `POST /recommendations/generate` - Generate AI recommendations
- `POST /recommendations/accept` - Accept recommendation and add to list

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

---

## Frontend Architecture

### Component Organization

```
src/
├── components/
│   ├── common/         # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── lists/          # List management components
│   ├── titles/         # Title management components
│   ├── recommendations/# AI recommendation components
│   ├── settings/       # Settings components
│   └── layout/         # Layout components
├── pages/              # Route-level components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── api/                # API client and functions
├── utils/              # Utility functions
└── styles/             # Global styles
```

### State Management Strategy

**Context API** for global state:
- `AuthContext` - User authentication state
- `ListContext` - Lists and titles state
- `ThemeContext` - UI theme preferences
- `NotificationContext` - Toast notifications

**Custom Hooks** for data fetching:
- `useAuth()` - Authentication operations
- `useLists()` - List management
- `useTitles()` - Title operations
- `useDragAndDrop()` - Drag-and-drop logic

### Routing Structure

```
/ (redirect to /dashboard or /login)
├── /login
├── /register
├── /dashboard (protected)
├── /recommendations (protected)
└── /settings (protected)
```

---

## Code Organization

### File Size Limit

**Maximum 500 lines per file** - enforced strictly

When a file approaches 500 lines:
1. Extract helper functions to separate files
2. Split services into multiple focused modules
3. Break components into smaller sub-components
4. Move constants/types to dedicated files

### Backend Directory Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── database/        # Neo4j connection & queries
│   │   ├── connection.js
│   │   ├── queries/     # Organized by entity
│   │   ├── migrations/  # Schema migrations
│   │   └── seed/        # Seed data scripts
│   ├── middleware/      # Express middleware
│   ├── models/          # Data validation models
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # Route definitions
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
└── tests/
    ├── unit/            # Unit tests
    ├── integration/     # Integration tests
    ├── e2e/             # End-to-end tests
    └── fixtures/        # Test data
```

### Frontend Directory Structure

See [Frontend Architecture](#frontend-architecture) section above.

---

## Development Conventions

### Naming Conventions

**Files:**
- Backend: `camelCase.js` (e.g., `authService.js`)
- Frontend Components: `PascalCase.jsx` (e.g., `LoginForm.jsx`)
- Test files: `*.test.js` or `*.test.jsx`
- Style files: `*.module.css` (CSS Modules)

**Variables:**
- camelCase for variables and functions
- PascalCase for React components and classes
- UPPER_SNAKE_CASE for constants

**Database:**
- PascalCase for Neo4j node labels (`:User`, `:Title`)
- UPPER_SNAKE_CASE for relationships (`:IN_WATCH_QUEUE`)
- camelCase for properties (`userId`, `createdAt`)

### Code Style

**JavaScript/JSX:**
- ES6+ syntax (async/await, destructuring, arrow functions)
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects/arrays

**Tools:**
- ESLint for linting
- Prettier for formatting
- Pre-commit hooks (optional)

### Documentation

**Backend Functions:**
```javascript
/**
 * Authenticates user and returns JWT token.
 *
 * @param {string} email - User's email address
 * @param {string} password - User's password (plain text)
 * @returns {Promise<{user: Object, token: string}>} User object and JWT
 * @throws {AuthenticationError} If credentials are invalid
 */
async function login(email, password) {
  // Implementation
}
```

**React Components:**
```jsx
/**
 * Title card component with drag-and-drop support.
 *
 * @param {Object} props - Component props
 * @param {Object} props.title - Title object from API
 * @param {Function} props.onDragStart - Callback when drag starts
 * @param {Function} props.onClick - Callback when card is clicked
 * @returns {JSX.Element}
 */
function TitleCard({ title, onDragStart, onClick }) {
  // Implementation
}
```

### Git Workflow

**Branch Naming:**
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/what-changed` - Code refactoring
- `test/what-tested` - Test additions

**Commit Messages:**
```
<type>: <short description>

<detailed description if needed>

<footer: issue references, breaking changes>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

---

## Testing Strategy

### Coverage Goals

- **Backend**: 70%+ coverage
- **Frontend**: 60%+ coverage
- **Critical paths**: 90%+ coverage (auth, title movement, AI recommendations)

### Testing Pyramid

```
     /\
    /E2E\    ← Few (5-10 tests)
   /──────\
  /Integration\ ← Some (20-30 tests)
 /────────────\
/  Unit Tests  \ ← Many (100+ tests)
──────────────────
```

### Backend Testing

**Unit Tests** (Jest):
- All service functions
- Database query builders
- Utility functions
- Middleware

**Integration Tests** (Supertest):
- API endpoint workflows
- Authentication flows
- Title lifecycle (add → move → rate)
- Error handling

### Frontend Testing

**Component Tests** (React Testing Library):
- Render without errors
- User interactions (clicks, inputs)
- Conditional rendering
- Error states

**Hook Tests**:
- Data fetching
- State updates
- Error handling

**E2E Tests** (Playwright or Cypress):
- Complete user journeys
- Registration → login → create list → add title → rate
- Critical workflows

---

## Deployment Strategy

### Development Environment

```bash
# Backend
cd backend
npm install
npm run dev  # nodemon on port 3001

# Frontend
cd frontend
npm install
npm run dev  # Vite on port 5173

# Neo4j
docker compose up neo4j
```

### Production Deployment (Future)

**Options:**
1. **Traditional VPS**: Backend + Frontend + Neo4j on single server
2. **Containerized**: Docker Compose on cloud provider
3. **Serverless**: Frontend on Vercel/Netlify, Backend on Railway/Render
4. **Full Cloud**: AWS ECS + RDS + CloudFront

**Recommended for MVP**: Docker Compose on DigitalOcean/Linode ($10-20/month)

### Environment Variables

See separate `.env.example` files in `backend/` and `frontend/`

### CI/CD Pipeline (Optional)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    - Run backend tests
    - Run frontend tests
    - Check code coverage

  deploy:
    - Build Docker images
    - Deploy to production (on main branch)
```

---

## Implementation Phases

### Phase 1: Foundation (Current)
- Project setup
- Database schema
- Basic backend structure
- Basic frontend structure

### Phase 2: Backend Core
- Authentication system
- Database queries
- API endpoints
- Unit tests

### Phase 3: Frontend Core
- Authentication UI
- State management
- API integration
- Component library

### Phase 4: Main Features
- List management UI
- Title search & add
- Drag-and-drop
- Rating system

### Phase 5: AI Integration
- Claude API integration
- Recommendation engine
- Recommendation UI

### Phase 6: Polish & Deploy
- E2E tests
- Performance optimization
- Documentation
- Deployment

---

## Risk & Mitigation

### Technical Risks

1. **Neo4j Complexity**
   - Risk: Complex graph queries may be difficult to optimize
   - Mitigation: Start with simple queries, add indexes, profile slow queries

2. **AI API Costs**
   - Risk: Claude API usage could become expensive
   - Mitigation: Cache recommendations, rate limit, allow disabling AI features

3. **TMDB Rate Limits**
   - Risk: Hit TMDB API rate limits (40 req/10s)
   - Mitigation: Implement caching, request queue, fallback to manual entry

4. **Drag-and-Drop Performance**
   - Risk: Poor performance with large lists (1000+ titles)
   - Mitigation: Virtual scrolling, pagination, limit visible items

### Project Risks

1. **Scope Creep**
   - Risk: Adding too many features beyond MVP
   - Mitigation: Strict adherence to INITIAL.md requirements

2. **Testing Coverage**
   - Risk: Insufficient test coverage leading to bugs
   - Mitigation: Test-driven development, coverage requirements in CI

---

## Future Enhancements (Post-MVP)

1. Social features (share lists, collaborative lists)
2. Mobile app (React Native)
3. Offline support (Service Workers)
4. Real-time sync (WebSockets)
5. Statistics and insights dashboard
6. Price tracking for streaming services
7. Integration with other tracking services (Letterboxd, Trakt)
8. Bulk import from CSV
9. Dark mode
10. Accessibility improvements (WCAG 2.1 AA)

---

## References

- [INITIAL.md](/home/sfeltner/Projects/streaming-tracker/INITIAL.md) - Original requirements
- [TASK.md](/home/sfeltner/Projects/streaming-tracker/TASK.md) - Task tracking
- [Implementation Plan](/home/sfeltner/.claude/plans/breezy-sparking-anchor.md) - Detailed implementation plan

---

**Document Version**: 1.0
**Last Updated**: 2026-01-04
**Next Review**: After Phase 1 completion
