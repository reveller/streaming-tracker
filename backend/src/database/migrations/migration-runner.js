/**
 * Migration Runner Script
 *
 * Executes Neo4j Cypher migration files to set up database schema.
 * Run with: npm run db:migrate
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import connection from '../connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Execute a single migration file.
 *
 * @param {string} filePath - Path to migration file
 * @returns {Promise<void>}
 */
async function executeMigration(filePath) {
  console.log(`\nExecuting migration: ${path.basename(filePath)}`);

  try {
    const cypherContent = await fs.readFile(filePath, 'utf-8');

    // Split into individual statements (separated by semicolons)
    const statements = cypherContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('//'));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      // Skip comments and empty lines
      if (statement.startsWith('//') || statement.length === 0) {
        skipCount++;
        continue;
      }

      try {
        await connection.executeQuery(statement);
        successCount++;
      } catch (error) {
        // Some statements may fail if already exist (like constraints), which is OK
        if (error.message.includes('already exists') || error.message.includes('ConstraintAlreadyExists')) {
          console.log(`  ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          skipCount++;
        } else {
          console.error(`  ❌ Failed: ${statement.substring(0, 50)}...`);
          throw error;
        }
      }
    }

    console.log(`✅ Migration completed: ${successCount} statements executed, ${skipCount} skipped`);
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Run all migrations in order.
 *
 * @returns {Promise<void>}
 */
async function runMigrations() {
  console.log('='.repeat(70));
  console.log('Neo4j Database Migration Runner');
  console.log('='.repeat(70));

  try {
    // Connect to database
    console.log('\n📡 Connecting to Neo4j...');
    await connection.connect();

    // Get migration files
    const migrationsDir = __dirname;
    const files = await fs.readdir(migrationsDir);

    const migrationFiles = files
      .filter(file => file.endsWith('.cypher'))
      .sort(); // Execute in alphabetical order (001-, 002-, etc.)

    if (migrationFiles.length === 0) {
      console.log('\n⚠️  No migration files found');
      return;
    }

    console.log(`\n📂 Found ${migrationFiles.length} migration(s):`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));

    // Execute each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      await executeMigration(filePath);
    }

    // Verify schema
    console.log('\n🔍 Verifying schema...');
    const verificationQueries = [
      { query: 'MATCH (u:User) RETURN count(u) as count', label: 'Users' },
      { query: 'MATCH (g:Genre) RETURN count(g) as count', label: 'Genres' },
      { query: 'MATCH (s:StreamingService) RETURN count(s) as count', label: 'Streaming Services' },
      { query: 'MATCH (t:Title) RETURN count(t) as count', label: 'Titles' },
      { query: 'MATCH (l:ListGroup) RETURN count(l) as count', label: 'List Groups' },
      { query: 'MATCH (r:Rating) RETURN count(r) as count', label: 'Ratings' }
    ];

    for (const { query, label } of verificationQueries) {
      const result = await connection.executeQuery(query, {}, 'READ');
      const count = result[0].get('count').toNumber();
      console.log(`   ${label}: ${count}`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ All migrations completed successfully!');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.disconnect();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
