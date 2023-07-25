import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import bcrypt             from 'bcrypt';
import express            from 'express';

import { globals }  from './utility/common.js';
import { AppError } from './utility/error.js';
import { logger }   from './utility/logger.js';

/**
 * Authentication middleware for the API. Executes before any of the route handlers.
 * Authorization is handled within the route handlers according to the resource being accessed, and the role being used.
 *
 * @param {string} req.headers.authorization - The HTTP Authorization header, which should be in the format "Basic <base64-encoded username:roletype:password>".
 */
export const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Rule out any invalid requests.
  const token = (req.headers.authorization || '').split(' ')[1] || '';
  if (token === undefined) {
    logger.error(`Invalid authorization token sent.`);
    return res.status(HttpStatusCode.BadRequest).send();
  }

  // Decode the HTTP Basic Auth token.
  const http_credentials   = Buffer.from(token, 'base64').toString().split(':');
  const http_name_and_role = http_credentials[0].split(' ');
  const http_username      = http_name_and_role[0];
  const http_roletype      = http_name_and_role[1];
  const http_password      = http_credentials[1];

  // The database should have already been initialized by this point.
  assert(globals.db !== undefined);

  // Check the database if the user exists.
  const db_user = await globals.db.get('SELECT id, is_enabled FROM User WHERE name = ?', http_username);
  if (db_user === undefined) {
    logger.error(`Invalid username "${http_username}".`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // Check if the user is enabled.
  if (db_user.is_enabled !== 1) {
    logger.error(`User "${http_username}" tried to authenticate but this user is disabled.`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  /**
   * The roletype is the authorization type requested by the user.
   * These are the role types that are currently supported by the application:
   *
   * "view" - View access         - Permits read-only access to the user's calendars and events.
   * "main" - Maintainence access - Permits read access to the user's calendars and events, with the ability to acknowledge/delete singular events, clearing them out.
   * "edit" - Edit access         - Permits read-write access to all of the user's owned assets, including their calendars, events, template agendas, and messages.
   * "root" - Admin access        - Permits read-write access to all assets, regardless of ownership. Unrestricted. Use with caution.
   * "cron" - Crontab access      - Permits adding and deleting individual events only. Specifically for Cron, i.e. internal use only.
   *
   * Anything else is automatically 403'd.
   *
   * Every role requires a different (meaning separately-maintained) password from each other role.
   * 
   */

  // Check if the user has the role requested.
  const db_principal = await globals.db.get('SELECT password, is_enabled FROM Principal WHERE user_id = ? AND role = ?', db_user.id, http_roletype);
  if (db_principal === undefined) {
    logger.error(`User "${http_username}" tried to authorize with the role "${http_roletype}", which they do not have.`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // Check if the role is enabled for the user, even if they have it.
  if (db_principal.is_enabled !== 1) {
    logger.error(`User "${http_username}" tried to authenticate with the role "${http_roletype}", but this role is disabled for the user.`);
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // Check the password of the user for their role matches the correct one in the database via. bcrypt.
  if (await bcrypt.compare(http_password, db_principal.password)) {
    // Allows passing the credentials to the route handler(s).
    // See types/express/index.d.ts for what allows the request object to be extended to include this.
    // The route handlers provide authorization, whereas this particular middleware strictly only provides authentication.
    req.credentials = {
      username: http_username,
      roletype: http_roletype,
      password: http_password,
    };

    // The user is now authenticated.
    return next();
  }

  // If the password does not match, return a 403.
  logger.error(`User "${http_username}" tried to authenticate with an incorrect password.`);
  return res.status(HttpStatusCode.Forbidden).send();
};
