// ============================================================================
// Migration: 001-initial-schema.cypher
// Description: Initial database schema for Streaming Tracker
// Created: 2026-01-04
// ============================================================================

// ----------------------------------------------------------------------------
// CONSTRAINTS (Uniqueness)
// ----------------------------------------------------------------------------

// User constraints
CREATE CONSTRAINT user_email_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

CREATE CONSTRAINT user_username_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.username IS UNIQUE;

CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Genre constraints
CREATE CONSTRAINT genre_name_unique IF NOT EXISTS
FOR (g:Genre) REQUIRE g.name IS UNIQUE;

CREATE CONSTRAINT genre_id_unique IF NOT EXISTS
FOR (g:Genre) REQUIRE g.id IS UNIQUE;

// StreamingService constraints
CREATE CONSTRAINT service_name_unique IF NOT EXISTS
FOR (s:StreamingService) REQUIRE s.name IS UNIQUE;

CREATE CONSTRAINT service_id_unique IF NOT EXISTS
FOR (s:StreamingService) REQUIRE s.id IS UNIQUE;

// Title constraints
CREATE CONSTRAINT title_tmdb_unique IF NOT EXISTS
FOR (t:Title) REQUIRE t.tmdbId IS UNIQUE;

CREATE CONSTRAINT title_id_unique IF NOT EXISTS
FOR (t:Title) REQUIRE t.id IS UNIQUE;

// ListGroup constraints
CREATE CONSTRAINT listgroup_id_unique IF NOT EXISTS
FOR (l:ListGroup) REQUIRE l.id IS UNIQUE;

// Rating constraints
CREATE CONSTRAINT rating_id_unique IF NOT EXISTS
FOR (r:Rating) REQUIRE r.id IS UNIQUE;

// ----------------------------------------------------------------------------
// INDEXES (Performance)
// ----------------------------------------------------------------------------

// User indexes
CREATE INDEX user_email_idx IF NOT EXISTS
FOR (u:User) ON (u.email);

CREATE INDEX user_created_at_idx IF NOT EXISTS
FOR (u:User) ON (u.createdAt);

// Title indexes
CREATE INDEX title_type_idx IF NOT EXISTS
FOR (t:Title) ON (t.type);

CREATE INDEX title_year_idx IF NOT EXISTS
FOR (t:Title) ON (t.year);

CREATE INDEX title_name_idx IF NOT EXISTS
FOR (t:Title) ON (t.title);

CREATE INDEX title_created_at_idx IF NOT EXISTS
FOR (t:Title) ON (t.createdAt);

// ListGroup indexes
CREATE INDEX listgroup_media_type_idx IF NOT EXISTS
FOR (l:ListGroup) ON (l.mediaType);

CREATE INDEX listgroup_created_at_idx IF NOT EXISTS
FOR (l:ListGroup) ON (l.createdAt);

// Rating indexes
CREATE INDEX rating_stars_idx IF NOT EXISTS
FOR (r:Rating) ON (r.stars);

CREATE INDEX rating_created_at_idx IF NOT EXISTS
FOR (r:Rating) ON (r.createdAt);

// Genre indexes
CREATE INDEX genre_name_idx IF NOT EXISTS
FOR (g:Genre) ON (g.name);

// StreamingService indexes
CREATE INDEX service_name_idx IF NOT EXISTS
FOR (s:StreamingService) ON (s.name);

CREATE INDEX service_active_idx IF NOT EXISTS
FOR (s:StreamingService) ON (s.isActive);

// ----------------------------------------------------------------------------
// INITIAL SEED DATA (Default Genres)
// ----------------------------------------------------------------------------

// Create default genres
MERGE (g1:Genre {name: 'Action'})
ON CREATE SET
  g1.id = randomUUID(),
  g1.description = 'Action and adventure films',
  g1.createdAt = datetime();

MERGE (g2:Genre {name: 'Comedy'})
ON CREATE SET
  g2.id = randomUUID(),
  g2.description = 'Comedy films and series',
  g2.createdAt = datetime();

MERGE (g3:Genre {name: 'Drama'})
ON CREATE SET
  g3.id = randomUUID(),
  g3.description = 'Dramatic films and series',
  g3.createdAt = datetime();

MERGE (g4:Genre {name: 'Sci-Fi'})
ON CREATE SET
  g4.id = randomUUID(),
  g4.description = 'Science fiction',
  g4.createdAt = datetime();

MERGE (g5:Genre {name: 'Horror'})
ON CREATE SET
  g5.id = randomUUID(),
  g5.description = 'Horror and thriller',
  g5.createdAt = datetime();

MERGE (g6:Genre {name: 'Romance'})
ON CREATE SET
  g6.id = randomUUID(),
  g6.description = 'Romantic films and series',
  g6.createdAt = datetime();

MERGE (g7:Genre {name: 'Documentary'})
ON CREATE SET
  g7.id = randomUUID(),
  g7.description = 'Documentary films and series',
  g7.createdAt = datetime();

MERGE (g8:Genre {name: 'Animation'})
ON CREATE SET
  g8.id = randomUUID(),
  g8.description = 'Animated content',
  g8.createdAt = datetime();

MERGE (g9:Genre {name: 'Fantasy'})
ON CREATE SET
  g9.id = randomUUID(),
  g9.description = 'Fantasy and magical themes',
  g9.createdAt = datetime();

MERGE (g10:Genre {name: 'Crime'})
ON CREATE SET
  g10.id = randomUUID(),
  g10.description = 'Crime and mystery',
  g10.createdAt = datetime();

// ----------------------------------------------------------------------------
// INITIAL SEED DATA (Default Streaming Services)
// ----------------------------------------------------------------------------

// Create default streaming services
MERGE (s1:StreamingService {name: 'Netflix'})
ON CREATE SET
  s1.id = randomUUID(),
  s1.logoUrl = 'https://example.com/logos/netflix.png',
  s1.baseUrl = 'https://www.netflix.com',
  s1.isActive = true,
  s1.createdAt = datetime();

MERGE (s2:StreamingService {name: 'Disney+'})
ON CREATE SET
  s2.id = randomUUID(),
  s2.logoUrl = 'https://example.com/logos/disneyplus.png',
  s2.baseUrl = 'https://www.disneyplus.com',
  s2.isActive = true,
  s2.createdAt = datetime();

MERGE (s3:StreamingService {name: 'Hulu'})
ON CREATE SET
  s3.id = randomUUID(),
  s3.logoUrl = 'https://example.com/logos/hulu.png',
  s3.baseUrl = 'https://www.hulu.com',
  s3.isActive = true,
  s3.createdAt = datetime();

MERGE (s4:StreamingService {name: 'Amazon Prime Video'})
ON CREATE SET
  s4.id = randomUUID(),
  s4.logoUrl = 'https://example.com/logos/prime.png',
  s4.baseUrl = 'https://www.amazon.com/Prime-Video',
  s4.isActive = true,
  s4.createdAt = datetime();

MERGE (s5:StreamingService {name: 'HBO Max'})
ON CREATE SET
  s5.id = randomUUID(),
  s5.logoUrl = 'https://example.com/logos/hbomax.png',
  s5.baseUrl = 'https://www.hbomax.com',
  s5.isActive = true,
  s5.createdAt = datetime();

MERGE (s6:StreamingService {name: 'Apple TV+'})
ON CREATE SET
  s6.id = randomUUID(),
  s6.logoUrl = 'https://example.com/logos/appletv.png',
  s6.baseUrl = 'https://tv.apple.com',
  s6.isActive = true,
  s6.createdAt = datetime();

MERGE (s7:StreamingService {name: 'Discovery+'})
ON CREATE SET
  s7.id = randomUUID(),
  s7.logoUrl = 'https://example.com/logos/discoveryplus.png',
  s7.baseUrl = 'https://www.discoveryplus.com',
  s7.isActive = true,
  s7.createdAt = datetime();

// ----------------------------------------------------------------------------
// SCHEMA VERIFICATION QUERIES
// ----------------------------------------------------------------------------

// Return counts to verify schema creation
MATCH (u:User) RETURN count(u) as userCount;
MATCH (g:Genre) RETURN count(g) as genreCount;
MATCH (s:StreamingService) RETURN count(s) as serviceCount;
MATCH (t:Title) RETURN count(t) as titleCount;
MATCH (l:ListGroup) RETURN count(l) as listGroupCount;
MATCH (r:Rating) RETURN count(r) as ratingCount;
