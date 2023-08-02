import { strict as assert } from 'assert';
import crypto               from 'crypto';
import fs                   from 'fs';
import * as url             from 'url';

import bcrypt                          from 'bcrypt';
import { Sequelize, DataTypes, Model } from 'sequelize';
import sqlite                          from 'sqlite';
import sqlite3                         from 'sqlite3';

import { AppError } from '../../utility/error.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const database_path  = __dirname + 'database.sqlite';
const bootstrap_path = __dirname + 'database.sql';

// Open the database connection (or try to).
const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: database_path
});


let db: sqlite.Database<sqlite3.Database, sqlite3.Statement>;
try {
  db = await sqlite.open({
    filename: database_path,
    driver:   sqlite3.Database,
  });
} catch (err) {
  assert(err instanceof Error);
  throw new AppError('The database is inaccessible and/or cannot be created.', { is_fatal: true, is_wrapper: true, original: err });
}

// If the database is empty, bootstrap it.
// The SQL file is (supposed to be) idempotent, and therefore will leave an existing database alone.
try {
  const bootstrap_data = await fs.promises.readFile(bootstrap_path);
  await db.exec(bootstrap_data.toString());
} catch (err) {
  assert(err instanceof Error);
  throw new AppError('The database initialization script is inaccessible and/or cannot be read.', { is_fatal: true, is_wrapper: true, original: err });
}

// Since the root user by default has admin privileges, and endpoints to give other users admin-ship also require it, root is necessary as a starting point to create other admin users from.
const root_username = 'root';
const root_rolename = 'root';
const root_password = await bcrypt.hash(root_username, 10);

// Cron is an internal user created specifically for Cron to interact with this application using.
const cron_username       = 'cron';
const cron_rolename       = 'cron';
const cron_password_plain = crypto.randomBytes(32).toString('hex');
const cron_password_hash  = await bcrypt.hash(cron_password_plain, 10);
const cron_password_path  = __dirname + '.sasspass';

let result;
try {
  // Tries to retrieve the root user from the database, or creates it if does not exist.
  result = await db.get('SELECT * FROM User WHERE name = ?', root_username);
  if (result === undefined) {
    await db.run('INSERT INTO User (name) VALUES (?)', root_username);

    const id = (await db.get('SELECT id FROM User WHERE name = ?', root_username)).id;
    await db.run('INSERT INTO Principal (user_id, role, password) VALUES (?, ?, ?)', id, root_rolename, root_password);
  }

  // Tries to retrieve the cron user from the database, or creates it if does not exist.
  result = await db.get('SELECT * FROM User WHERE name = ?', cron_username);
  if (result === undefined) {
    await db.run('INSERT INTO User (name) VALUES (?)', cron_username);

    const id = (await db.get('SELECT id FROM User WHERE name = ?', cron_username)).id;
    await db.run('INSERT INTO Principal (user_id, role, password) VALUES (?, ?, ?)', id, cron_rolename, cron_password_hash);
  }
} catch (err) {
  assert(err instanceof Error);
  throw new AppError('An error occurred while attempting to query the database.', { is_fatal: true, is_wrapper: true, original: err });
}

// Check if the cron password file (or its path) already exists.
// If not, try to write the cron password to a file (the one it created here) for Cron to start using.
// Does not replace if it already exists.
let cron_password_stats;
try {
  cron_password_stats = await fs.promises.stat(cron_password_path);
} catch (err) {
  try {
    await fs.promises.writeFile(cron_password_path, cron_password_plain, { flag: 'wx' });
  } catch (err) {
    assert(err instanceof Error);
    throw new AppError('The password file is inaccessible and/or cannot be created.', { is_fatal: true, is_wrapper: true, original: err });
  }
}

// Set the database permissions to 600 for (a little) extra security.
try {
  await fs.promises.chmod(database_path, 0o600);
  await fs.promises.chmod(cron_password_path, 0o600);
} catch (err) {
  assert(err instanceof Error);
  throw new AppError('An error occurred while setting the database permissions.', { is_fatal: true, is_wrapper: true, original: err });
}

// Export the database.
export default db;
