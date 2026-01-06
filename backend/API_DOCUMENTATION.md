# Streaming Tracker - API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:3001/api`
**Last Updated**: 2026-01-05

---

## Table of Contents

1. [Authentication](#authentication)
2. [List Groups](#list-groups)
3. [Titles](#titles)
4. [Ratings](#ratings)
5. [Genres](#genres)
6. [Streaming Services](#streaming-services)
7. [Recommendations](#recommendations)
8. [TMDB Integration](#tmdb-integration)
9. [Error Responses](#error-responses)

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Register
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "Password123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "createdAt": "2026-01-05T10:00:00Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token"
  },
  "message": "User registered successfully"
}
```

### Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "lastLoginAt": "2026-01-05T10:00:00Z"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token"
  }
}
```

### Refresh Token
**POST** `/auth/refresh`

Get new access and refresh tokens.

**Request Body:**
```json
{
  "refreshToken": "jwt_token"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_jwt_token"
  }
}
```

### Get Current User
**GET** `/auth/me` 🔒

Get authenticated user's profile with statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "createdAt": "2026-01-05T10:00:00Z",
      "lastLoginAt": "2026-01-05T10:30:00Z",
      "stats": {
        "totalLists": 5,
        "totalTitles": 42,
        "totalRatings": 30
      }
    }
  }
}
```

### Update Profile
**PATCH** `/auth/profile` 🔒

Update email or username.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "username": "newusername"
}
```

**Response:** `200 OK`

### Change Password
**PATCH** `/auth/password` 🔒

Change user password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response:** `200 OK`

### Logout
**POST** `/auth/logout` 🔒

Logout user (client should discard tokens).

**Response:** `200 OK`

---

## List Groups

### Create List Group
**POST** `/lists` 🔒

Create a new genre-based list group.

**Request Body:**
```json
{
  "genreId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "listGroup": {
      "id": "uuid",
      "genre": {
        "id": "uuid",
        "name": "Action"
      },
      "createdAt": "2026-01-05T10:00:00Z",
      "updatedAt": "2026-01-05T10:00:00Z"
    }
  },
  "message": "List group created successfully"
}
```

### Get All List Groups
**GET** `/lists` 🔒

Get all list groups for authenticated user.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "listGroups": [
      {
        "id": "uuid",
        "genre": {
          "id": "uuid",
          "name": "Action"
        },
        "titleCount": 15,
        "createdAt": "2026-01-05T10:00:00Z",
        "updatedAt": "2026-01-05T10:30:00Z"
      }
    ]
  }
}
```

### Get List Group with Titles
**GET** `/lists/:listGroupId` 🔒

Get a specific list group with all its titles organized by list type.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "listGroup": {
      "id": "uuid",
      "genre": {
        "id": "uuid",
        "name": "Action"
      },
      "titles": {
        "watchQueue": [...],
        "currentlyWatching": [...],
        "alreadyWatched": [...]
      },
      "stats": {
        "totalTitles": 15,
        "watchQueue": 8,
        "currentlyWatching": 3,
        "alreadyWatched": 4,
        "ratedCount": 4,
        "averageRating": 4.25
      }
    }
  }
}
```

### Delete List Group
**DELETE** `/lists/:listGroupId` 🔒

Delete a list group and all its title relationships.

**Response:** `200 OK`

### Get List Group Statistics
**GET** `/lists/:listGroupId/stats` 🔒

Get statistics for a list group.

**Response:** `200 OK`

---

## Titles

### Create Title
**POST** `/titles` 🔒

Create a new title (movie or TV series).

**Request Body:**
```json
{
  "type": "MOVIE",
  "name": "Inception",
  "tmdbId": "27205",
  "releaseYear": "2010",
  "posterUrl": "https://image.tmdb.org/t/p/w500/...",
  "overview": "A thief who steals..."
}
```

**Response:** `201 Created`

### Get Title by ID
**GET** `/titles/:titleId` 🔒

Get detailed title information.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "title": {
      "id": "uuid",
      "type": "MOVIE",
      "name": "Inception",
      "releaseYear": "2010",
      "posterUrl": "https://...",
      "overview": "...",
      "services": [
        {
          "id": "uuid",
          "name": "Netflix"
        }
      ],
      "rating": {
        "stars": 5,
        "review": "Amazing movie!"
      }
    }
  }
}
```

### Search Titles
**GET** `/titles/search?q=inception&limit=20` 🔒

Search titles by name.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Max results (default: 20)

**Response:** `200 OK`

### Get User's Titles
**GET** `/titles/my-titles` 🔒

Get all titles for authenticated user across all list groups.

**Response:** `200 OK`

### Add Title to List
**POST** `/titles/:titleId/add-to-list` 🔒

Add a title to a list group.

**Request Body:**
```json
{
  "listGroupId": "uuid",
  "listType": "WATCH_QUEUE"
}
```

**Valid list types**: `WATCH_QUEUE`, `CURRENTLY_WATCHING`, `ALREADY_WATCHED`

**Response:** `200 OK`

### Move Title Between Lists
**PATCH** `/titles/:titleId/move` 🔒

Move a title to a different list (drag-and-drop support).

**Request Body:**
```json
{
  "listGroupId": "uuid",
  "newListType": "CURRENTLY_WATCHING",
  "newPosition": 2
}
```

**Response:** `200 OK`

### Update Title Position
**PATCH** `/titles/:titleId/position` 🔒

Update title position within the same list (reorder).

**Request Body:**
```json
{
  "listGroupId": "uuid",
  "newPosition": 0
}
```

**Response:** `200 OK`

### Remove Title from List
**DELETE** `/titles/:titleId/lists/:listGroupId` 🔒

Remove a title from a list group.

**Response:** `200 OK`

### Link Title to Service
**POST** `/titles/:titleId/services` 🔒

Link a title to a streaming service.

**Request Body:**
```json
{
  "serviceId": "uuid"
}
```

**Response:** `200 OK`

### Unlink Title from Service
**DELETE** `/titles/:titleId/services/:serviceId` 🔒

Unlink a title from a streaming service.

**Response:** `200 OK`

---

## Ratings

### Create/Update Rating
**PUT** `/ratings/titles/:titleId` 🔒

Create or update a rating for a title.

**Request Body:**
```json
{
  "stars": 5,
  "review": "Amazing movie! Highly recommended."
}
```

**Stars**: Integer between 1-5
**Review**: Optional, max 1000 characters

**Response:** `200 OK`

### Get Rating for Title
**GET** `/ratings/titles/:titleId` 🔒

Get rating for a specific title.

**Response:** `200 OK`

### Delete Rating
**DELETE** `/ratings/titles/:titleId` 🔒

Delete a rating.

**Response:** `200 OK`

### Get User's Ratings
**GET** `/ratings/my-ratings` 🔒

Get all ratings for authenticated user.

**Response:** `200 OK`

### Get Rating Statistics
**GET** `/ratings/stats` 🔒

Get rating statistics for authenticated user.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRated": 42,
      "averageRating": 4.2,
      "fiveStars": 15,
      "fourStars": 20,
      "threeStars": 5,
      "twoStars": 2,
      "oneStar": 0
    }
  }
}
```

### Get Top Rated Titles
**GET** `/ratings/top-rated?limit=10` 🔒

Get top rated titles for authenticated user.

**Query Parameters:**
- `limit` (optional): Max results (default: 10)

**Response:** `200 OK`

### Get Recently Rated Titles
**GET** `/ratings/recent?limit=10` 🔒

Get recently rated titles for authenticated user.

**Response:** `200 OK`

### Get Titles by Rating
**GET** `/ratings/by-stars/:stars` 🔒

Get titles with a specific star rating (1-5).

**Response:** `200 OK`

---

## Genres

### Get All Genres
**GET** `/genres`

Get all available genres.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "genres": [
      {
        "id": "uuid",
        "name": "Action",
        "createdAt": "2026-01-05T10:00:00Z"
      }
    ]
  }
}
```

### Get Genre by ID
**GET** `/genres/:genreId`

Get a specific genre.

**Response:** `200 OK`

---

## Streaming Services

### Get All Services
**GET** `/services`

Get all streaming services.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "uuid",
        "name": "Netflix",
        "logoUrl": "https://...",
        "createdAt": "2026-01-05T10:00:00Z"
      }
    ]
  }
}
```

### Get Service by ID
**GET** `/services/:serviceId`

Get a specific streaming service.

**Response:** `200 OK`

### Get Titles by Service
**GET** `/services/:serviceId/titles?limit=50`

Get titles available on a streaming service.

**Response:** `200 OK`

---

## Recommendations

### Get Personalized Recommendations
**GET** `/recommendations?count=5&genre=Action` 🔒

Get AI-powered personalized recommendations based on user ratings.

**Query Parameters:**
- `count` (optional): Number of recommendations (default: 5)
- `genre` (optional): Filter by genre

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "title": "The Dark Knight",
        "type": "MOVIE",
        "year": "2008",
        "reason": "Based on your high ratings for action films..."
      }
    ],
    "reasoning": "Full AI explanation...",
    "basedOnRatings": 42,
    "averageRating": 4.2
  }
}
```

### Get Recommendations by Genre
**GET** `/recommendations/genre/:genreName?count=5` 🔒

Get recommendations for a specific genre.

**Response:** `200 OK`

### Explain Recommendation
**POST** `/recommendations/explain` 🔒

Get explanation for why a specific title is recommended.

**Request Body:**
```json
{
  "titleName": "The Matrix"
}
```

**Response:** `200 OK`

---

## TMDB Integration

### Search Movies
**GET** `/tmdb/search/movies?q=inception&page=1` 🔒

Search for movies on TMDB.

**Query Parameters:**
- `q` (required): Search query
- `page` (optional): Page number (default: 1)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "tmdbId": "27205",
        "type": "MOVIE",
        "name": "Inception",
        "releaseYear": "2010",
        "posterUrl": "https://...",
        "overview": "...",
        "voteAverage": 8.4,
        "voteCount": 30000
      }
    ],
    "page": 1,
    "totalPages": 5,
    "totalResults": 100
  }
}
```

### Search TV Series
**GET** `/tmdb/search/tv?q=breaking bad&page=1` 🔒

Search for TV series on TMDB.

**Response:** `200 OK`

### Search Multi (Movies + TV)
**GET** `/tmdb/search/multi?q=matrix&page=1` 🔒

Search for both movies and TV series on TMDB.

**Response:** `200 OK`

### Get Movie Details
**GET** `/tmdb/movie/:tmdbId` 🔒

Get detailed movie information from TMDB.

**Response:** `200 OK`

### Get TV Series Details
**GET** `/tmdb/tv/:tmdbId` 🔒

Get detailed TV series information from TMDB.

**Response:** `200 OK`

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Request validation failed
- `NO_TOKEN` (401): No authorization token provided
- `INVALID_TOKEN` (401): Invalid or expired token
- `NOT_FOUND` (404): Resource not found
- `INTERNAL_ERROR` (500): Internal server error
- `TMDB_SERVICE_ERROR` (503): TMDB API error
- `AI_SERVICE_ERROR` (503): AI service error

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required or failed
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: External service error

---

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## Legend

🔒 = Requires authentication (Bearer token)

---

**API Version**: 1.0.0
**Last Updated**: 2026-01-05
**Total Endpoints**: 48
