import { strict as assert } from 'assert';
import fs                   from 'fs';
import * as url             from 'url';

import bcrypt      from 'bcrypt';
import * as sqlite from 'sqlite';
import sqlite3     from 'sqlite3';

import { AppError } from '../utility/error.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const database_path  = __dirname + 'database.sqlite';
const bootstrap_path = __dirname + 'database.sql';

export const boostrap = async () => {
  // Open the database connection.
  const db = await sqlite.open({
    filename: database_path,
    driver:   sqlite3.Database,
  });

  // Check if the database (or its path) already exists.
  let database_stats;
  try {
    database_stats = await fs.promises.stat(await fs.promises.realpath(database_path));
    if (!database_stats.isFile()) {
      throw new AppError('The database path is not a file.', { is_fatal: true });
    }
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
    throw new AppError('An error occurred while bootstrapping the database.', { is_fatal: true, is_wrapper: true, original: err });
  }

  // Since the root user by default has admin privileges, and endpoints to give admin-ship also require one to have this, root is necessary as a starting point to create other admin users from.
  const root_username = 'root';
  let   root_password = await bcrypt.hash(root_username, 10);

  // Tries to retrieve the root user from the database.
  let result;
  try {
    result = await db.get('SELECT * FROM User WHERE username = ?', root_username);
  } catch (err) {
    assert(err instanceof Error);
    throw new AppError('An error occurred while checking for the existence of the root user.', { is_fatal: true, is_wrapper: true, original: err });
  }

  // If the root user does not exist, create it.
  if (result === undefined) {
    try {
      await db.run('INSERT INTO User (username, root_password) VALUES (?, ?)', root_username, root_password);
    } catch (err) {
      assert(err instanceof Error);
      throw new AppError('An error occurred while creating the root user.', { is_fatal: true, is_wrapper: true, original: err });
    }
  }

  // Set the database permissions to 600 for (a little) extra security.
  try {
    await fs.promises.chmod(database_path, 0o600);
  } catch (err) {
    assert(err instanceof Error);
    throw new AppError('An error occurred while setting the database permissions.', { is_fatal: true, is_wrapper: true, original: err });
  }

  return db;
};
