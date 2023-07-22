import { strict as assert } from 'assert';

import express from 'express';

import { globals }                 from '../../utility/common.js';
import { routes as messageRoutes } from './message.js';
//import { routes as trapRoutes }    from './trap';

interface Message {
  id:    number;
  title: string;
}

interface Agenda {
  id:       number;
  parent?:  number;
  owner:    string;
  cron: {
    active: string;
    expire: string;
  };
  messages?: Message[];
  children?: Agenda[];
}

export const routes = express.Router();

/**
 * Resource-level authorization middleware for agenda routes.
 * 
 * Makes sure the authenticated user is authorized as an admin, or owns the message being accessed and is using the appropriate authorization for the given endpoint.
 */
routes.use('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return next();
});

/**
 * While there is another message route, this one affects specifically how this agenda uses them.
 * Messages are deliberately cross-agenda, so that particularly large payloads and specific can be reused.
 */
routes.use('/:id/message', messageRoutes);

/**
 * Traps are webhooks that are triggered when a specific event occurs, and are used for push notifications.
 * They are configured per agenda, which then gets tied to specific calendars and events.
 * As of currently, all notifications are pull/polling-based, but it makes sense for this to change in the future.
 */
//routes.use('/:id/trap', trapRoutes);

/**
 * Deep-retrieve a specific agenda from the database (admin or same-user-as-owner minimum editor authorization required).
 * This will retrieve the entire agenda tree starting at the agenda specified as the root.
 *
 * @param {number} req.params.id - The ID of the agenda to retrieve (required).
 *
 * @returns {Agenda} The agenda object with its messages and child sub-agendas.
 */
routes.get('/deep/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Shallow-retrieve a specific agenda from the database (admin or same-user-as-owner minimum editor authorization required).
 * This will retrieve the agenda showing its parent ID (the way it is stored in the database).
 *
 * @param {number} req.params.id - The ID of the agenda to retrieve (required).
 *
 * @returns {Agenda} The agenda object with its messages and the ID of its parent.
 */
routes.get('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    assert(globals.db !== undefined);
    const row = globals.db.get('SELECT * FROM Agenda WHERE id = ?', req.params.id);
    return res.status(200).json(row);
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieve a list of all agendas from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @returns {Agenda[]} An array of agenda objects, with message lists ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    assert(globals.db !== undefined);
    const rows = globals.db.all('SELECT * FROM Agenda');
    return res.status(200).json(rows);
  } catch (err) {
    return next(err);
  }
});

/**
 * Deep-copy an existing agenda to a new agenda (admin or same-user-as-owner minimum editor authorization required).
 * A deep-copy will also creates copies of the agenda's messages, sub-agendas, their messages, their sub-agendas, and so on.
 *
 * @param {number} req.params.id - The ID of the agenda to copy (required).
 *
 * @returns {Agenda} The new agenda with its ID for further customization.
 */
routes.post('/deep/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Shallow-copy an existing agenda to a new agenda (admin or same-user-as-owner minimum editor authorization required).
 * Shallow copying only copies the agenda itself. Modifying any messages or sub-agendas will still affect both agendas.
 *
 * @param {number} req.params.id - The ID of the agenda to copy (required).
 *
 * @returns {Agenda} The new agenda with its ID for further customization.
 */
routes.post('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Create a new agenda (admin or same-user-as-owner minimum editor authorization required).
 * An agenda is used as a template for calendars, as well as sub-collections of events.
 * Agendas carry recurrence information, which gets used to form Cron jobs.
 * The Cron jobs are then used to generate events, which are then tied to the calendars themselves.
 *
 * @returns {Agenda} The new agenda with its ID for further customization.
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Edit an existing agenda's parent identifier in the database (admin or same-user-as-owner minimum editor authorization required).
 * The parent agenda creates a reference time frame for all it's sub-agendas.
 * Sub-agendas are not incorporated into a calendar (as new events) until the parent agenda becomes active.
 * Subsequently, sub-agenda-spawned events are removed from the calendar when the parent agenda expires.
 * To nullify/remove the parent, use the DELETE method instead.
 * Note that calendars that use this agenda need to be refreshed in order to reflect the changes.
 *
 * @param {number} req.body.parent - The ID of the parent agenda (required).
 */
routes.put('/:id/parent', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Edit an existing agenda's activating cron expression in the database (admin or same-user-as-owner minimum editor authorization required).
 * The activating cron expression is used by Cron to determine when the agenda's events (formed by its messages and sub-agenda messages) should be added to the database, and subsequently, to the calendars.
 * The activating cron expression cannot be nullified/deleted, as a starting point is always required.
 * Note that calendars that use this agenda need to be refreshed in order to reflect the changes.
 *
 * @param {string} req.body.cron - The cron expression for when the agenda should activate (required).
 */
routes.put('/:id/cron/active', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Edit an existing agenda's expiring cron expression in the database (admin or same-user-as-owner minimum editor authorization required).
 * The expiring cron expression is used by Cron to determine when the agenda's events (formed by its messages and sub-agenda messages) should be deleted from the database, and subsequently, from the calendars.
 * To nullify/remove the expiring cron expression, use the DELETE method instead.
 * Note that calendars that use this agenda need to be refreshed in order to reflect the changes.
 *
 * @param {string} req.body.cron - The cron expression for when the agenda should expire (required).
 */
routes.put('/:id/cron/expire', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Delete an existing agenda's parent identifier from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @param {number} req.params.id - The ID of the agenda's parent to remove (required).
 */
routes.delete('/:id/parent', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Delete an existing agenda's expiring cron expression from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @param {number} req.params.id - The ID of the agenda's expiring cron expression to remove (required).
 */
routes.delete('/:id/cron/expire', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Deep-delete an existing agenda from the database (admin or same-user-as-owner minimum editor authorization required).
 * Deep-deleting an agenda will also delete all of the agenda's associated messages and sub-agendas.
 * When the agenda is deleted, so will all of the agenda's associated events and the Cron jobs used to active and expire them.
 * Note that this will *not* delete the agenda's linked messages. The messages form an event's "content"; the agenda only forms the event's context/time window.
 * However, this means that any calendars that use this agenda will not be able to refresh without also losing the events the agenda would have spawned.
 *
 * @param {number} req.params.id - The ID of the agenda to delete (required).
 */
routes.delete('/deep/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});

/**
 * Shallow-delete an existing agenda from the database (admin or same-user-as-owner minimum editor authorization required).
 * Shallow-deleting will only delete this agenda, and not any of its associated messages or sub-agendas.
 * When the agenda is deleted, so will all of the agenda's associated events and the Cron jobs used to active and expire them.
 * Note that this will *not* delete the agenda's linked messages. The messages form an event's "content"; the agenda only forms the event's context/time window.
 * However, this means that any calendars that use this agenda will not be able to refresh without also losing the events the agenda would have spawned.
 *
 * @param {number} req.params.id - The ID of the agenda to delete (required).
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(200).send();
});
