/**
 * Promote Admin CLI Script
 *
 * Promotes an existing user to admin role by email address.
 *
 * Usage: node src/database/seed/promote-admin.js <email>
 */

import dotenv from 'dotenv';
import connection from '../connection.js';
import { serializeNeo4jValue } from '../../utils/neo4j-serializer.js';

dotenv.config();

/**
 * Promote a user to admin role.
 *
 * @param {string} email - Email of the user to promote
 * @returns {Promise<void>}
 */
async function promoteAdmin(email) {
  if (!email) {
    console.error('Usage: node src/database/seed/promote-admin.js <email>');
    process.exit(1);
  }

  try {
    await connection.connect();

    const cypher = `
      MATCH (u:User {email: $email})
      SET u.role = 'admin'
      RETURN u {
        .id,
        .email,
        .username,
        .role
      } AS user
    `;

    const result = await connection.executeQuery(cypher, { email });

    if (result.length === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    const user = serializeNeo4jValue(result[0].get('user'));
    console.log(`Successfully promoted user to admin:`);
    console.log(`  ID:       ${user.id}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role:     ${user.role}`);
  } catch (error) {
    console.error('Failed to promote user:', error.message);
    process.exit(1);
  } finally {
    await connection.disconnect();
  }
}

const email = process.argv[2];
promoteAdmin(email);
