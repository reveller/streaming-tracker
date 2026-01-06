/**
 * Neo4j Data Serialization Utilities
 *
 * Converts Neo4j-specific data types to plain JavaScript values.
 */

import neo4j from 'neo4j-driver';

/**
 * Serialize Neo4j value to plain JavaScript.
 *
 * Converts Neo4j Integer, Date, DateTime, and other types to regular JS types.
 *
 * @param {*} value - Value to serialize
 * @returns {*} Serialized value
 */
export function serializeNeo4jValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Neo4j Integer
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }

  // Handle Neo4j Date
  if (neo4j.isDate(value)) {
    return new Date(value.year, value.month - 1, value.day).toISOString().split('T')[0];
  }

  // Handle Neo4j DateTime
  if (neo4j.isDateTime(value)) {
    return new Date(
      value.year.toNumber(),
      value.month.toNumber() - 1,
      value.day.toNumber(),
      value.hour.toNumber(),
      value.minute.toNumber(),
      value.second.toNumber(),
      value.nanosecond.toNumber() / 1000000
    ).toISOString();
  }

  // Handle Neo4j LocalDateTime
  if (neo4j.isLocalDateTime(value)) {
    return new Date(
      value.year.toNumber(),
      value.month.toNumber() - 1,
      value.day.toNumber(),
      value.hour.toNumber(),
      value.minute.toNumber(),
      value.second.toNumber(),
      value.nanosecond.toNumber() / 1000000
    ).toISOString();
  }

  // Handle Neo4j Time
  if (neo4j.isTime(value)) {
    const hours = value.hour.toNumber().toString().padStart(2, '0');
    const minutes = value.minute.toNumber().toString().padStart(2, '0');
    const seconds = value.second.toNumber().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  // Handle Neo4j LocalTime
  if (neo4j.isLocalTime(value)) {
    const hours = value.hour.toNumber().toString().padStart(2, '0');
    const minutes = value.minute.toNumber().toString().padStart(2, '0');
    const seconds = value.second.toNumber().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  // Handle Neo4j Duration
  if (neo4j.isDuration(value)) {
    return {
      months: value.months.toNumber(),
      days: value.days.toNumber(),
      seconds: value.seconds.toNumber(),
      nanoseconds: value.nanoseconds.toNumber()
    };
  }

  // Handle Neo4j Point (spatial)
  if (neo4j.isPoint(value)) {
    return {
      x: value.x,
      y: value.y,
      z: value.z,
      srid: value.srid.toNumber()
    };
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map(item => serializeNeo4jValue(item));
  }

  // Handle Objects (recursively serialize properties)
  if (typeof value === 'object') {
    const serialized = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = serializeNeo4jValue(val);
    }
    return serialized;
  }

  // Return primitive values as-is
  return value;
}

/**
 * Serialize an array of Neo4j records.
 *
 * @param {Array} records - Neo4j records
 * @param {string} [key] - Optional key to extract from each record
 * @returns {Array} Serialized records
 */
export function serializeRecords(records, key = null) {
  return records.map(record => {
    const data = key ? record.get(key) : record.toObject();
    return serializeNeo4jValue(data);
  });
}

export default {
  serializeNeo4jValue,
  serializeRecords
};
