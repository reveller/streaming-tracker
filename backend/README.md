# Streaming Tracker - Backend API

RESTful API backend for the Streaming Tracker application built with Node.js, Express.js, and Neo4j.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Neo4j 5.x (Graph Database)
- **Authentication**: JWT (JSON Web Tokens)
- **External APIs**:
  - TMDB (The Movie Database) - Title metadata
  - Anthropic Claude API - AI recommendations
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (for Neo4j)
- TMDB API Key ([Get it here](https://www.themoviedb.org/settings/api))
- Anthropic API Key ([Get it here](https://console.anthropic.com/))

## Getting Started

### 1. Clone and Navigate

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `NEO4J_PASSWORD` - Neo4j database password
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `REFRESH_TOKEN_SECRET` - Secret for refresh tokens (min 32 characters)
- `TMDB_API_KEY` - Your TMDB API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key

### 4. Start Neo4j Database

From the project root directory:

```bash
docker-compose up -d neo4j
```

Verify Neo4j is running:
- Browser UI: http://localhost:7474
- Bolt: bolt://localhost:7687
- Default credentials: `neo4j` / `streamingtracker123`

### 5. Run Database Migrations

```bash
npm run db:migrate
```

This will:
- Create database constraints
- Create indexes for performance
- Seed default genres
- Seed default streaming services

### 6. Start Development Server

```bash
npm run dev
```

The API will be available at: http://localhost:3001/api

## Available Scripts

### Development
- `npm run dev` - Start development server with nodemon (auto-reload)
- `npm start` - Start production server

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:e2e` - Run end-to-end tests only

### Database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── database/        # Database connection & queries
│   │   ├── connection.js
│   │   ├── queries/     # Cypher queries by entity
│   │   ├── migrations/  # Schema migrations
│   │   └── seed/        # Seed data scripts
│   ├── middleware/      # Express middleware
│   ├── models/          # Data validation models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
└── tests/
    ├── unit/            # Unit tests
    ├── integration/     # Integration tests
    ├── e2e/             # End-to-end tests
    └── fixtures/        # Test data
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Lists
- `GET /api/lists` - Get all user lists
- `POST /api/lists` - Create new list
- `GET /api/lists/:id` - Get list details
- `PATCH /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Titles
- `GET /api/titles/search` - Search TMDB for titles
- `POST /api/lists/:listId/titles` - Add title to list
- `PATCH /api/titles/:titleId/move` - Move title between lists
- `DELETE /api/lists/:listId/titles/:titleId` - Remove title
- `GET /api/titles/:titleId` - Get title details

### Ratings
- `POST /api/titles/:titleId/ratings` - Rate a title
- `PATCH /api/ratings/:ratingId` - Update rating
- `DELETE /api/ratings/:ratingId` - Delete rating
- `GET /api/ratings/stats` - Get user rating stats

### Genres
- `GET /api/genres` - Get all genres
- `POST /api/genres` - Create genre
- `DELETE /api/genres/:genreId` - Delete genre

### Services
- `GET /api/services` - Get all streaming services
- `POST /api/services` - Create service
- `PATCH /api/services/:serviceId` - Update service
- `DELETE /api/services/:serviceId` - Delete service

### Recommendations
- `POST /api/recommendations/generate` - Generate AI recommendations
- `POST /api/recommendations/accept` - Accept recommendation

## Development Guidelines

### Code Style
- Follow ESLint and Prettier configurations
- Maximum 500 lines per file
- Use ES6+ syntax (async/await, arrow functions, destructuring)
- Write JSDoc comments for all functions

### File Organization
- Controllers handle HTTP requests/responses
- Services contain business logic
- Database queries in separate query files
- One concern per file

### Testing
- Write unit tests for all services
- Write integration tests for API endpoints
- Aim for 70%+ code coverage
- Follow AAA pattern (Arrange, Act, Assert)

### Error Handling
- Use custom error classes
- Return consistent error responses
- Log errors with Winston
- Never expose sensitive data in errors

## Database Schema

### Nodes
- **User** - Application users
- **ListGroup** - Collection of 3 lists (Watch Queue, Currently Watching, Already Watched)
- **Genre** - Movie/series genres
- **StreamingService** - Streaming platforms
- **Title** - Movies and TV series
- **Rating** - User ratings for titles

### Relationships
- `(User)-[:OWNS]->(ListGroup)`
- `(ListGroup)-[:INCLUDES_GENRE]->(Genre)`
- `(ListGroup)-[:HAS_ACCESS_TO]->(StreamingService)`
- `(Title)-[:IN_WATCH_QUEUE]->(ListGroup)`
- `(Title)-[:CURRENTLY_WATCHING]->(ListGroup)`
- `(Title)-[:ALREADY_WATCHED]->(ListGroup)`
- `(Title)-[:AVAILABLE_ON]->(StreamingService)`
- `(User)-[:RATED]->(Rating)-[:FOR_TITLE]->(Title)`

See [PLANNING.md](../PLANNING.md) for complete schema documentation.

## Troubleshooting

### Neo4j Connection Issues
1. Verify Neo4j is running: `docker ps`
2. Check logs: `docker logs streaming-tracker-neo4j`
3. Verify credentials in `.env` match docker-compose.yml

### Migration Failures
1. Ensure Neo4j is running and accessible
2. Check `NEO4J_PASSWORD` in `.env`
3. Review migration logs for specific errors

### Port Already in Use
- Change `PORT` in `.env` if 3001 is taken
- Change Neo4j ports in docker-compose.yml if needed

## License

Apache 2.0

## Related Documentation

- [PLANNING.md](../PLANNING.md) - Architecture and design decisions
- [TASK.md](../TASK.md) - Task tracking
- [API Documentation](../docs/API.md) - Complete API specification (coming soon)
