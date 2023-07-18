import { strict as assert } from 'assert';

import bcrypt          from 'bcrypt';
import express         from 'express';
import { StatusCodes } from 'http-status-codes';

import { globals }  from './utility/common.js';
import { AppError } from './utility/error.js';
import { logger }   from './utility/logger.js';

/**
 * Authentication middleware for the API. Executes before any of the route handlers.
 * Authorization is handled within the route handlers according to the resource being accessed.
 *
 * @param {string} req.headers.authorization - The HTTP Authorization header, which should be in the format "Basic <base64-encoded username:roletype:password>".
 */
export const authenticator = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Rule out any invalid requests.
  const token = (req.headers.authorization || '').split(' ')[1] || '';
  if (token === undefined) {
    res.status(StatusCodes.FORBIDDEN).send();
  }

  // Decode the HTTP Basic Auth token.
  const http_credentials = Buffer.from(token, 'base64').toString().split(':');
  const http_username    = http_credentials[0];
  const http_password    = http_credentials[2];

  /**
   * The roletype is the authorization level requested by the user.
   * There are four role types:
   *
   * "view" - View access         - Permits read-only access to the user's calendars and events.
   * "main" - Maintainence access - Permits read access to the user's calendars and events, with the ability to acknowledge/delete singular events, clearing them out.
   * "edit" - Edit access         - Permits read-write access to all of the user's owned assets, including their calendars, events, template agendas, and messages.
   * "root" - Admin access        - Permits read-write access to all assets, regardless of ownership. Unrestricted. Use with caution.
   *
   * Each requires a different password, though higher access levels grant all the same permissions as lower ones.
   */
  const http_roletype = http_credentials[1];
  switch (http_roletype) {
    case 'view':
    case 'main':
    case 'edit':
    case 'root':
      break;
    default:
      res.status(StatusCodes.FORBIDDEN).send();
  }

  // Check the database if the user exists.
  let db_stored: any;
  try {
    assert(globals.db !== undefined);
    db_stored = globals.db.get('SELECT * FROM User WHERE username = ?', http_username);
  } catch (err) {
    assert(err instanceof Error);
    throw new AppError('Unable to retrieve user from database.', { is_fatal: true, is_wrapper: true, original: err });
  }

  // If the user does not exist, return a 403.
  if (db_stored === undefined) {
    res.status(StatusCodes.FORBIDDEN).send();
  }

  // Allows passing the credentials to the route handler(s).
  // See types/express/index.d.ts for what allows the request object to be extended to include this.
  // The route handlers provide authorization, whereas this particular middleware strictly only provides authentication.
  req.credentials = {
    username: http_username,
    roletype: http_roletype,
    password: http_password,
  };

  // Skip requiring password the correct password for localhost.
  if ((req.socket.remoteAddress === '127.0.0.1') || (req.socket.remoteAddress === '::1')) {
    return next();
  }

  // Retrieve the password from the database based on the authorization level requested by the user.
  let db_password;
  switch (http_roletype) {
    case 'view':
      db_password = db_stored.view_password;
      break;
    case 'main':
      db_password = db_stored.main_password;
      break;
    case 'edit':
      db_password = db_stored.edit_password;
      break;
    case 'root':
      db_password = db_stored.root_password;
      break;
  }

  // If the user does not have a password set for the requested authorization level, return a 403.
  if (db_password === undefined) {
    res.status(StatusCodes.FORBIDDEN).send();
  }

  // Check the password of the user matches the correct one in the database via. bcrypt.
  if (await bcrypt.compare(db_password, http_password)) {
    return next();
  }

  // If the password does not match, return a 403.
  res.status(StatusCodes.FORBIDDEN).send();
};
