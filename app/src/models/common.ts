import { strict as assert } from 'assert';

import { ISqlite, Statement } from 'sqlite';

import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

export type Primitive = string | number | boolean | null;

export const exists = async (table: string, where: Map<string, Primitive>): Promise<boolean> => {
  let query       = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE `;
  let commas_left = where.size - 1;
  for (const key in where) {
    query += `${key[0]} = ?`;
    if (commas_left > 0) {
      query += ' AND ';
      commas_left--;
    }
  }
  query += ') AS "exists"';

  const values = [ ];
  for (const key in where) {
    values.push(key[1]);
  }

  const result = await db.get(query, values);

  return ((result !== undefined) && (result.exists === 1));
}

export const insertMapped = async (table: string, mappings: Map<string, [string, Primitive]>): Promise<number> => {
  let value_count = mappings.size;

  let query       = `INSERT INTO ${table} (`;
  let commas_left = value_count - 1;
  for (const key in mappings) {
    query += key[0];
    if (commas_left > 0) {
      query += ', ';
      commas_left--;
    }
  }
  query       += ') VALUES (';
  commas_left =  value_count - 1;
  for (const key in mappings) {
    query += '?';
    if (commas_left > 0) {
      query += ', ';
      commas_left--;
    }
  }
  query += ')';

  const values = [ ];
  for (const key in mappings) {
    values.push(key[1]);
  }

  const result = await db.run(query, values);
  if ((result === undefined) || (result.lastID === undefined)) {
    throw new AppError(`Could not insert into table "${table}".`, { is_fatal: false });
  }

  return result.lastID;
}

export const updateMapped = async (table: string, mappings: Map<string, [string, Primitive]>, where: Map<string, Primitive>): Promise<number> => {
  let value_count = mappings.size;

  let query       = `UPDATE ${table} SET `;
  let commas_left = value_count - 1;
  for (const key in mappings) {
    query += `${key[0]} = ?`;
    if (commas_left > 0) {
      query += ', ';
      commas_left--;
    }
  }
  query       += ' WHERE ';
  commas_left =  where.size - 1;
  for (const key in where) {
    query += `${key[0]} = ?`;
    if (commas_left > 0) {
      query += ' AND ';
      commas_left--;
    }
  }

  const values = [ ];
  for (const key in mappings) {
    values.push(key[1]);
  }
  for (const key in where) {
    values.push(key[1]);
  }

  const result = await db.run(query, values);
  if ((result === undefined) || (result.lastID === undefined)) {
    throw new AppError(`Could not insert into table "${table}".`, { is_fatal: false });
  }

  return result.lastID;
}
