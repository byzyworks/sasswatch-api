import { HttpStatusCode } from 'axios';
import bcrypt             from 'bcrypt';
import express            from 'express';

import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

/**
 * Authentication middleware for the API. Executes before any of the route handlers.
 * Authorization is handled within the route handlers according to the resource being accessed, and the role being used.
 *
 * @param {string} req.headers.authorization - The HTTP Authorization header, which should be in the format "Basic <base64-encoded username:roletype:password>".
 */
export default async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Initialize the credentials for the session.
    auth.initialize(req.headers.authorization);
  } catch (err) {
    // The one explicit error thrown in auth.initialize() indicates a badly-formatted authorization header.
    if (err instanceof AppError) {
      error_handler.handle(err);
      return res.status(HttpStatusCode.BadRequest).send();
    }
    
    // Cannot rule out other possible errors that might indicate faulty logic.
    throw err;
  }

  // Check the database if the user exists.
  const db_user = await db.get('SELECT id, is_enabled FROM User WHERE name = ?', auth.username);
  if (db_user === undefined) {
    logger.error(`Invalid username "${auth.username}".`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // For convenient retrieval over the rest of the session.
  auth.id = db_user.id;

  // Check if the user is enabled.
  if (db_user.is_enabled !== 1) {
    logger.error(`User "${auth.username}" tried to authenticate but this user is disabled.`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // Check if the user has the role requested.
  const db_principal = await db.get('SELECT password, is_enabled FROM Principal WHERE user_id = ? AND role = ?', auth.id, auth.role);
  if (db_principal === undefined) {
    logger.error(`User "${auth.username}" tried to authorize with the role "${auth.role}", which they do not have.`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // Check if the role is enabled for the user, even if they have it.
  if (db_principal.is_enabled !== 1) {
    logger.error(`User "${auth.username}" tried to authenticate with the role "${auth.role}", but this role is disabled for the user.`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // Check the password of the user for their role matches the correct one in the database via. bcrypt.
  if (await bcrypt.compare(auth.password || '', db_principal.password)) {
    // The user is now authenticated.
    return next();
  }

  // If the password does not match, return a 403.
  logger.error(`User "${auth.username}" tried to authenticate with an incorrect password.`);
  return res.status(HttpStatusCode.Forbidden).send();
};
