import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import bcrypt             from 'bcrypt';
import express            from 'express';

import { authorizeRoute } from '../../middleware/authorizeRoute.js';
import { globals }        from '../../services/auth/roles.js';

export const routes = express.Router({ mergeParams: true });

/**
 * Disable the role from authorizing, but do not delete it, keeping the password intact (an admin may be needed to re-enable it later).
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 */
routes.put('/:role/lock', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum editor authorization required.
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The cron user's role cannot be disabled.
  if (req.params.username === 'cron') {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // The user must exist, first.
  const user = await globals.db.get('SELECT id FROM User WHERE name = ?', req.params.username);
  if (user === undefined) {
    return res.status(HttpStatusCode.NotFound).send();
  }

  // The role must also exist for the user.
  const principal = await globals.db.get('SELECT * FROM Principal WHERE user_id = ? AND role = ?', user.id, req.params.role);
  if (principal === undefined) {
    return res.status(HttpStatusCode.NotFound).send();
  }
  
  // Disable the role for the user.
  await globals.db.run('UPDATE Principal SET is_enabled = 0 WHERE user_id = ? AND role = ?', user.id, req.params.role);
  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Either give the user a new role by creating a password for them to access that role with, or updates the user's password for that role.
 * Note if an empty or no password is supplied, this is NOT equivalent to deleting the role. This will give them password-less access - effectively the opposite.
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 * @param {string} req.body.password   The user's new password, pre-hashed, base64 encoded (optional).
 */
routes.put('/:role/password', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum editor authorization required.
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  switch (req.params.username) {
    case 'root':
      // The root user can only act as an admin.
      if (req.params.role !== 'root') {
        return res.status(HttpStatusCode.Forbidden).send();
      }
      break;
    case 'cron':
      // The cron user password is automatically generated and cannot be changed.
      return res.status(HttpStatusCode.Forbidden).send();
  }

  // The available roles are defined by the program. You cannot have "custom" roles.
  // 'cron' as a role is not included here because it is not a normal user role.
  switch (req.params.role) {
    case 'view':
    case 'main':
    case 'edit':
    case 'root':
      break;
    default:
      return res.status(HttpStatusCode.BadRequest).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Get the user's profile.
  const user = await globals.db.get('SELECT id FROM User WHERE name = ?', req.params.username);

  // The user must exist, first.
  if (user === undefined) {
    return res.status(HttpStatusCode.NotFound).send();
  }

  // Hash the new password.
  const password_hash = await bcrypt.hash(req.body.password, 10);

  // If the role does not exist for the user yet, create the role with the new password.
  const principal = await globals.db.get('SELECT * FROM Principal WHERE user_id = ? AND role = ?', user.id, req.params.role);
  if (principal === undefined) {
    await globals.db.run('INSERT INTO Principal (user_id, role, password) VALUES (?, ?, ?)', user.id, req.params.role, password_hash);
    return res.status(HttpStatusCode.Created).send();
  }

  // Otherwise, update the role's password for the user.
  await globals.db.run('UPDATE Principal SET password = ? WHERE user_id = ? AND role = ?', password_hash, user.id, req.params.role);
  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Enable the role for authorization, after it has been disabled.
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 */
routes.delete('/:role/lock', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum editor authorization required.
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }
  
  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Get the user's profile.
  const user = await globals.db.get('SELECT id FROM User WHERE name = ?', req.params.username);

  // The user must exist, first.
  if (user === undefined) {
    return res.status(HttpStatusCode.NotFound).send();
  }

  // The role must also exist for the user.
  const principal = await globals.db.get('SELECT * FROM Principal WHERE user_id = ? AND role = ?', user.id, req.params.role);
  if (principal === undefined) {
    return res.status(HttpStatusCode.NotFound).send();
  }

  // Enable the role for the user.
  await globals.db.run('UPDATE Principal SET is_enabled = 1 WHERE user_id = ? AND role = ?', user.id, req.params.role);
  return res.status(HttpStatusCode.NoContent).send();
});

/**
 * Delete the role from the user, along with the password they have for that role.
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 */
routes.delete('/:role', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum editor authorization required.
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The root user's admin role cannot be deleted, and neither can the cron user's own role.
  switch (req.params.username) {
    case 'root':
    case 'cron':
      return res.status(HttpStatusCode.Forbidden).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Get the user's profile.
  const user = await globals.db.get('SELECT id FROM User WHERE name = ?', req.params.username);

  // The user must exist, first.
  if (user === undefined) {
    return res.status(HttpStatusCode.NotFound).send();
  }

  // No need to check if the role exists for the user, since we're deleting it anyway.

  // Delete the role for the user.
  await globals.db.get('DELETE FROM Principal WHERE user_id = ? AND role = ?', user.id, req.params.role);
  return res.status(HttpStatusCode.NoContent).send();
});
