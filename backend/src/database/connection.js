/**
 * Neo4j Database Connection Module
 *
 * Manages connection to Neo4j database using the official Neo4j driver.
 * Provides singleton instance and connection management utilities.
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

class Neo4jConnection {
  constructor() {
    this.driver = null;
    this.isConnected = false;
  }

  /**
   * Initialize Neo4j driver and establish connection.
   *
   * @returns {Promise<neo4j.Driver>} Neo4j driver instance
   * @throws {Error} If connection fails
   */
  async connect() {
    if (this.driver) {
      console.log('Neo4j driver already initialized');
      return this.driver;
    }

    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD;

    if (!password) {
      throw new Error('NEO4J_PASSWORD environment variable is required');
    }

    try {
      this.driver = neo4j.driver(
        uri,
        neo4j.auth.basic(user, password),
        {
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 30000,
          logging: {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`)
          }
        }
      );

      // Verify connectivity
      await this.verifyConnectivity();

      this.isConnected = true;
      console.log('Neo4j driver initialized successfully');
      console.log(`Connected to: ${uri}`);

      return this.driver;
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      throw new Error(`Neo4j connection failed: ${error.message}`);
    }
  }

  /**
   * Verify database connectivity.
   *
   * @returns {Promise<void>}
   * @throws {Error} If verification fails
   */
  async verifyConnectivity() {
    const session = this.driver.session({
      database: process.env.NEO4J_DATABASE || 'neo4j'
    });

    try {
      const result = await session.run('RETURN 1 AS test');
      const test = result.records[0].get('test').toNumber();

      if (test !== 1) {
        throw new Error('Connectivity test failed');
      }

      console.log('Neo4j connectivity verified');
    } catch (error) {
      throw new Error(`Neo4j connectivity verification failed: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Get a new database session.
   *
   * @param {string} [mode='WRITE'] - Session mode: 'READ' or 'WRITE'
   * @returns {neo4j.Session} Database session
   */
  getSession(mode = 'WRITE') {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call connect() first.');
    }

    const accessMode = mode === 'READ'
      ? neo4j.session.READ
      : neo4j.session.WRITE;

    return this.driver.session({
      database: process.env.NEO4J_DATABASE || 'neo4j',
      defaultAccessMode: accessMode
    });
  }

  /**
   * Execute a Cypher query with parameters.
   *
   * @param {string} cypher - Cypher query
   * @param {Object} [params={}] - Query parameters
   * @param {string} [mode='WRITE'] - Session mode
   * @returns {Promise<Array>} Query results as array of records
   */
  async executeQuery(cypher, params = {}, mode = 'WRITE') {
    const session = this.getSession(mode);

    try {
      const result = await session.run(cypher, params);
      return result.records;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Execute a transaction with multiple operations.
   *
   * @param {Function} transactionWork - Function containing transaction operations
   * @returns {Promise<any>} Transaction result
   */
  async executeTransaction(transactionWork) {
    const session = this.getSession('WRITE');

    try {
      const result = await session.executeWrite(transactionWork);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Close database connection and cleanup resources.
   *
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.isConnected = false;
      console.log('Neo4j driver closed');
    }
  }

  /**
   * Get connection status.
   *
   * @returns {boolean} Connection status
   */
  getStatus() {
    return this.isConnected;
  }
}

// Singleton instance
const connection = new Neo4jConnection();

export default connection;
