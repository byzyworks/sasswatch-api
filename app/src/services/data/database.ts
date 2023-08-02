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
const db = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: database_path
});

// Export the database.
export default db;
