import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { authorizeResource, authorizeRoute } from '../../authorizer.js';
import { globals }                           from '../../utility/common.js';

export const routes = express.Router({ mergeParams: true });

interface Message {
  id:       number;
  owner:    string;
  title:    string;
  payload?: string;
}

/**
 * Does resource-level authorization for message routes.
 * 
 * In other words, this is for discretionary authorization that depends on the user's ownership rights.
 * Role-specific route authorization has to be handled at each route.
 */
routes.use('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeResource(req, 'Message') && res.status(HttpStatusCode.Forbidden).send();
});

/**
 * Retrieve a specific message from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @param {number} req.params.id - The ID of the message to retrieve (required).
 *
 * @returns {Message} The message object.
 */
routes.get('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Retrieve a list of messages from the database (admin or same-user-as-owner minimum editor authorization required).
 * If the user is authorized as an admin, this includes all messages in the database, regardless of owner.
 * If the user is authorized as anything less, this includes only the messages owned by the authenticated user.
 *
 * @returns {Message[]} An array of message objects, with payloads ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Create a new message (admin or same-user-as-owner minimum editor authorization required).
 * A message contains the display information that is associated with an event.
 *
 * @param {string} req.body.title - A short description of the message displayed when not being retrieved specifically, such as when displaying the calendar (required).
 *
 * @returns {Message} The new message with its ID for further customization.
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Created).send();
});

/**
 * Edit an existing message's title in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {string} req.body.title - A short description of the message displayed when not being retrieved specifically, such as when displaying the calendar (required).
 */
routes.put('/:id/title', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Edit an existing message's payload in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {any} req.body.payload - Any bit of information that the message will have as a payload, which is of an arbitrary format (required).
 */
routes.put('/:id/payload', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Edit an existing message's weight in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {string} req.body.weight - The number of times an event with this message can exist in a calendar before new events are ignored, where 0 or lower means no limit (required).
 */
routes.put('/:id/weight', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Delete an existing message's payload from the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 */
routes.delete('/:id/payload', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.NoContent).send();
});

/**
 * Delete an existing message from the database (admin or same-user-as-owner minimum editor authorization required).
 * This will also delete all associated events that link back to this message.
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.NoContent).send();
});
