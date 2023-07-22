import express from 'express';

import { globals } from '../utility/common.js';

export const routes = express.Router();

interface Message {
  id:       number;
  owner:    string;
  title:    string;
  payload?: string;
}

/**
 * Resource-level authorization middleware for message routes.
 *
 * Makes sure the authenticated user is authorized as an admin, or owns the message being accessed and is using the appropriate authorization for the given endpoint.
 */
routes.use('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return next();
});

/**
 * Retrieve a specific message from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @param {number} req.params.id - The ID of the message to retrieve (required).
 *
 * @returns {Message} The message object.
 */
routes.get('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Retrieve a list of messages from the database (admin or same-user-as-owner minimum editor authorization required).
 * If the user is authorized as an admin, this includes all messages in the database, regardless of owner.
 * If the user is authorized as anything less, this includes only the messages owned by the authenticated user.
 *
 * @returns {Message[]} An array of message objects, with payloads ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
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
  return res.status(200).send();
});

/**
 * Edit an existing message's title in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {string} req.body.title - A short description of the message displayed when not being retrieved specifically, such as when displaying the calendar (required).
 */
routes.put('/:id/title', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Edit an existing message's payload in the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 *
 * @param {any} req.body.payload - Any bit of information that the message will have as a payload, which is of an arbitrary format (required).
 */
routes.put('/:id/payload', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Delete an existing message's payload from the database (admin or same-user-as-owner minimum editor authorization required).
 * All events associated to this message will also be affected.
 */
routes.delete('/:id/payload', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Delete an existing message from the database (admin or same-user-as-owner minimum editor authorization required).
 * This will also delete all associated events that link back to this message.
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});
