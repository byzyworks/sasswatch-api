import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { authorizeRoute }       from '../../authorizer.js';
import { globals }              from '../../utility/common.js';
import { routes as roleRoutes } from './role.js';

interface Asset {
    id:     number;
    title?: string;
}

interface User {
    id:         number;
    username:   string;
    roles:      string[];
    calendars?: Asset[];
    agendas?:   Asset[];
    messages?:  Asset[];
}

export const routes = express.Router({ mergeParams: true });

/**
 * Resource-level authorization middleware for user routes.
 *
 * Makes sure the users being accessed are either the same user as the authenticated user, or that the authenticated user is authorized as an admin.
 * The user route has a custom authorizer since it the data lookup for usernames is slightly different than for resource ownership (that use user IDs).
 */
routes.use('/:username', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // To prevent TypeScript from complaining even though these resources have already been initialized.
  assert(req.credentials !== undefined);

  // Allows access to all users when authorized as an admin.
  const role = req.credentials.roletype;
  if (role === 'root') {
    return next();
  }

  // Non-admins only need to be able to access their own user profile.
  const user = req.credentials.username;
  if (user === req.params.username) {
    return next();
  }

  // Default deny.
  return res.status(HttpStatusCode.Forbidden).send();
});

/**
 * Roles can be thought of as user sub-types.
 * Roles permit certain actions that do not necessarily cross-authenticate (use the same password).
 */
routes.use('/:username/role', roleRoutes);

/**
 * Gets a basic user object with information that is sent in both GET requests.
 * 
 * @param username Username to come up with a user object for.
 * 
 * @returns The user object (passwords ommitted) or undefined if the user does not exist.
 */
const getUserBasicValues = async (username: string): Promise<User | undefined> => {
  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Get the user's profile.
  const user_raw = await globals.db.get('SELECT * FROM User WHERE name = ?', username);

  // Check if the user exists, first.
  if (user_raw === undefined) {
    return undefined;
  }

  // Collect a list of the roles that the user has.
  const user_roles = [ ];
  const user_roles_raw = await globals.db.all('SELECT role FROM Principal WHERE user_id = ?', user_raw.id);
  for (const role of user_roles_raw) {
    user_roles.push(role.role);
  }

  // Compile the user information object.
  const user: User = {
    id:       user_raw.id,
    username: user_raw.name,
    roles:    user_roles
  };

  // Export the object.
  return user;
};

/**
 * Gets asset information for a specific user using the common "grab by owner_id" method.
 * 
 * @param owner_id Username to come up with a list of assets for.
 * @param table    The asset type itself identified by the SQL table name.
 * 
 * @returns The list of a particular set of assets owned by the user.
 */
const getAssets = async (owner_id: number, table: string): Promise<Asset[]> => {
  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Collect a list of the particular type of asset that the user has.
  const assets: Asset[] = [];
  const assets_raw = await globals.db.all(`SELECT * FROM ${table} WHERE owner_id = ? ORDER BY title`, owner_id);
  for (const asset of assets_raw) {
    assets.push({ id: asset.id, title: asset.title });
  }

  // Export the asset list.
  return assets;
}

/**
 * Retrieve a specific user's profile information (excluding their passwords).
 *
 * @param {string} req.params.username The user to retrieve (required).
 *
 * @returns {User} The user object, with password hashes ommitted.
 */
routes.get('/:username', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum view-only authorization required.
  if (!(await authorizeRoute(req, ['view', 'main', 'edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Get the user's profile.
  const user_profile = await getUserBasicValues(req.params.username);

  // The user must exist, first.
  if (user_profile === undefined) {
    return res.status(HttpStatusCode.NotFound).send();
  }

  // Get the user's owned assets to be sent with their default profile metadata.
  user_profile.calendars = await getAssets(user_profile.id, 'Calendar');
  user_profile.agendas   = await getAssets(user_profile.id, 'Agenda');
  user_profile.messages  = await getAssets(user_profile.id, 'Message');

  // Export the user information object.
  return res.status(HttpStatusCode.Ok).send(user_profile);
});

/**
 * Retrieve a list of all users, ommitting their passwords and various owned assets.
 *
 * @returns {User[]} An array of user objects, with password hashes, owned calendars, agendas, and messages ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin authorization always required.
  if (!(await authorizeRoute(req, ['root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Collect a list of all users with their basic profile information (excluding their owned assets).
  const user_list: User[] = [];
  const users = await globals.db.all('SELECT name FROM User ORDER BY name');
  for (const user of users) {
    const user_profile = await getUserBasicValues(user.name);
    if (user_profile !== undefined) {
      user_list.push(user_profile);
    }
  }

  // Export the user list.
  return res.status(HttpStatusCode.Ok).send(user_list);
});

/**
 * Create a new user, with no roles assigned.
 *
 * @param {string} req.body.username The user principal to create (required) (must be unique).
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin authorization always required.
  if (!(await authorizeRoute(req, ['root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The username must be supplied.
  if (req.body.username === undefined) {
    return res.status(HttpStatusCode.BadRequest).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Check if the user already exists.
  const already_exists = await globals.db.get('SELECT id FROM User WHERE name = ?', req.body.username) !== undefined;
  if (already_exists) {
    return res.status(HttpStatusCode.Conflict).send();
  }

  // Create the user.
  await globals.db.run('INSERT INTO User (name) VALUES (?)', req.body.username);
  return res.status(HttpStatusCode.Created).send();
});

/**
 * Disable the user from authenticating, but do not delete it, keeping the password intact (an admin may be needed to re-enable it later).
 * 
 * @param {string} req.params.username The user to disable (required).
 */
routes.put('/:username/lock', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum editor authorization required.
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The cron user cannot be disabled.
  if (req.params.username === 'cron') {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // The user must exist, first.
  const doesnt_exist = await globals.db.get('SELECT id FROM User WHERE name = ?', req.params.username) === undefined;
  if (doesnt_exist) {
    return res.status(HttpStatusCode.NotFound).send();
  }

  // Disable the user from authenticating.
  await globals.db.run('UPDATE User SET is_enabled = 1 WHERE name = ?', req.params.username);
  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Enable the user for authentication, after it has been disabled.
 * 
 * @param {string} req.params.username The user to enable (required).
 */
routes.delete('/:username/lock', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum editor authorization required.
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }
  
  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Enable the user to authenticate, after being disabled.
  await globals.db.run('UPDATE User SET is_enabled = 0 WHERE name = ?', req.params.username);
  return res.status(HttpStatusCode.NoContent).send();
});

/**
 * Delete a specific user's account, as well as all of their assets, including calendars, agendas, messages, etc.
 *
 * @param {string} req.params.username The user to delete (required).
 */
routes.delete('/:username', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Admin or same-user minimum editor authorization required.
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The default root and cron users cannot be deleted, even when authorized as an admin or authenticated as them.
  switch (req.params.username) {
    case 'root':
    case 'cron':
      return res.status(HttpStatusCode.Forbidden).send();
  }

  // The database bootstrapper will have already run.
  assert(globals.db !== undefined);

  // Delete the user.
  await globals.db.run('DELETE FROM User WHERE name = ?', req.params.username);
  return res.status(HttpStatusCode.NoContent).send();
});
