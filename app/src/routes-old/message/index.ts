import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { authorizeResource, authorizeRoute } from '../../middleware/authorizeRoute.js';
import { globals }                           from '../../services/auth/roles.js';
import { logger }                            from '../../utility/logger.js';

export const routes = express.Router({ mergeParams: true });

interface Message {
  id:       number;
  owner?:   string;
  weight:   number;
  title:    string;
  payload?: string;
}

/**
 * Does resource-level authorization for message routes.
 * 
 * In other words, this is for discretionary authorization that depends on the user's ownership rights.
 * Role-specific route authorization has to be handled at each route.
 * 
 * @param {number} req.params.id The ID of the message being authorized (required).
 */
routes.use('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (await authorizeResource(req, 'Message')) {
    return next();
  }

  return res.status(HttpStatusCode.Forbidden).send();
});

/**
 * Retrieve a specific message from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @param {number} req.params.id The ID of the message to retrieve (required).
 *
 * @returns {Message} The message object.
 */
routes.get('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root', 'read', 'audt']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  // The database bootstrapper will have already run.
  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  // Get the message from the database.
  const message_raw = await globals.db.get('SELECT * FROM v_User_Message WHERE id = ?', req.params.id);

  // Check if the message exists, first.
  if (message_raw === undefined) {
    return undefined;
  }

  //
  const payload_parsed = JSON.parse(message_raw.payload);

  //
  const message: Message = {
    id:       message_raw.id,
    weight:   message_raw.weight,
    title:    message_raw.title,
    payload:  payload_parsed
  };

  // 
  switch (req.credentials.roletype) {
    case 'root':
    case 'audt':
      message.owner = message_raw.owner;
  }

  //
  return res.status(HttpStatusCode.Ok).json(message);
});

/**
 * Retrieve a list of messages from the database (admin or same-user-as-owner minimum editor authorization required).
 * If the user is authorized as an admin, this includes all messages in the database, regardless of owner.
 * If the user is authorized as anything less, this includes only the messages owned by the authenticated user.
 *
 * @returns {Message[]} An array of message objects, with payloads ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root', 'read', 'audt']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  let messages_raw;
  switch (req.credentials.roletype) {
    case 'root':
    case 'audt':
      messages_raw = await globals.db.all('SELECT * FROM v_User_Message ORDER BY title');
      break;
    default:
      messages_raw = await globals.db.all('SELECT * FROM v_User_Message WHERE name = ? ORDER BY title', req.credentials.username);
      break;
  }
  
  const message_list: Message[] = [];
  for (const message_raw of messages_raw) {
    const message: Message = {
      id:       message_raw.id,
      weight:   message_raw.weight,
      title:    message_raw.title
    };

    switch (req.credentials.roletype) {
      case 'root':
      case 'audt':
        message.owner = message_raw.owner;
    }

    message_list.push(message);
  }

  return res.status(HttpStatusCode.Ok).json(message_list);
});

/**
 * Create a new message (admin or same-user-as-owner minimum editor authorization required).
 * A message contains the display information that is associated with an event.
 *
 * @param {string} req.body.title A short description of the message displayed when not being retrieved specifically, such as when displaying the calendar (required).
 *
 * @returns {Message} The new message with its ID for further customization.
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  //
  try {
    JSON.parse(req.body);
  } catch (err) {
    logger.error('Failed to parse request body; not a valid JSON object.');
    return res.status(HttpStatusCode.BadRequest).send();
  }
  
  if (req.body.title === undefined) {
    return res.status(HttpStatusCode.BadRequest).send();
  }
  
  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  await globals.db.run('INSERT INTO Message (owner_id, title) VALUES (?, ?)', req.credentials.id, req.body.title);
  
  const message_id = await globals.db.get('SELECT last_insert_rowid() AS id');
  return res.status(HttpStatusCode.Created).json(message_id);
});

/**
 * Edit an existing message's title in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {number} req.params.id  The ID of the message to edit (required).
 * @param {string} req.body.title A short description of the message displayed when not being retrieved specifically, such as when displaying the calendar (required).
 */
routes.put('/:id/title', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }
  
  //
  try {
    JSON.parse(req.body);
  } catch (err) {
    logger.error('Failed to parse request body; not a valid JSON object.');
    return res.status(HttpStatusCode.BadRequest).send();
  }

  if (req.body.title === undefined) {
    return res.status(HttpStatusCode.BadRequest).send();
  }

  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  await globals.db.run('UPDATE Message SET title = ? WHERE id = ?', req.body.title, req.params.id);
  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Edit an existing message's payload in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {number} req.params.id The ID of the message to edit (required).
 * @param {any} req.body.payload Any bit of information that the message will have as a payload, which is of an arbitrary format (required).
 */
routes.put('/:id/payload', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  //
  try {
    JSON.parse(req.body);
  } catch (err) {
    logger.error('Failed to parse request body; not a valid JSON object.');
    return res.status(HttpStatusCode.BadRequest).send();
  }

  if (req.body.payload === undefined) {
    return res.status(HttpStatusCode.BadRequest).send();
  }

  let payload_string;
  try {
    payload_string = JSON.stringify(req.body.payload);
  } catch (err) {
    logger.error(`Invalid payload format: ${req.body.payload}`);
    return res.status(HttpStatusCode.BadRequest).send();
  }

  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);
  
  await globals.db.run('UPDATE Message SET payload = ? WHERE id = ?', payload_string, req.params.id);

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Edit an existing message's weight in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {number} req.params.id   The ID of the message to edit (required).
 * @param {number} req.body.weight The number of times an event with this message can exist in a calendar before new events are ignored, where 0 or lower means no limit (required).
 */
routes.put('/:id/weight', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  //
  try {
    JSON.parse(req.body);
  } catch (err) {
    logger.error('Failed to parse request body; not a valid JSON object.');
    return res.status(HttpStatusCode.BadRequest).send();
  }

  //
  if (req.body.weight <= 0) {
    return res.status(HttpStatusCode.BadRequest).send();
  }

  assert(globals.db !== undefined);

  await globals.db.run('UPDATE Message SET weight = ? WHERE id = ?', req.body.weight, req.params.id);
  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Delete an existing message's payload from the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 * 
 * @param {number} req.params.id The ID of the message from which payload to delete (required).
 */
routes.delete('/:id/payload', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);

  await globals.db.run('UPDATE Message SET payload = NULL WHERE id = ?', req.body.weight, req.params.id);
  return res.status(HttpStatusCode.NoContent).send();
});

/**
 * Delete an existing message from the database (admin or same-user-as-owner minimum editor authorization required).
 * This will also delete all associated events that link back to this message.
 * 
 * @param {number} req.params.id The ID of the message to delete (required).
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);

  await globals.db.run('DELETE FROM Message WHERE id = ?', req.params.id);
  return res.status(HttpStatusCode.NoContent).send();
});
