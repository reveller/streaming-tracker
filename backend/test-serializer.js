import neo4j from 'neo4j-driver';
import { serializeNeo4jValue } from './src/utils/neo4j-serializer.js';

// Test Neo4j Integer
const testInt = neo4j.int(42);
console.log('Neo4j Integer:', testInt);
console.log('Serialized Integer:', serializeNeo4jValue(testInt));

// Test nested object with Neo4j types
const testObj = {
  id: 'test',
  count: neo4j.int(100),
  nested: {
    value: neo4j.int(50)
  }
};
console.log('\nNeo4j Object:', JSON.stringify(testObj, null, 2));
console.log('\nSerialized Object:', JSON.stringify(serializeNeo4jValue(testObj), null, 2));
