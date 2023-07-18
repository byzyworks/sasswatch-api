import express from 'express';

import { globals } from '../../utility/common.js';

interface Event {
  id:        number;
  calendar?: number;
  time: {
    active: string;
    expire: string;
  };
  agendas:  number[];
  message:  number;
  title:    string;
  payload?: unknown;
}

export const routes = express.Router();

/**
 * Retrieve a specific calendar event from the database (admin or same-user-as-calendar-owner minimum view-only authorization required).
 * An event is an instance constructed from the combination of a message and any number of hierarchically-ordered agendas.
 * Therefore, when retrieving a specific event, the response will contain the information from its originating agenda(s) + message, as well as its generated active and expire datetime values.
 * The event will also be tied to a calendar, so the user must have access to that calendar in order to retrieve the event.
 * If no specific event is specified, all events that the user has access to will be returned in a table (omitting their "payload" information), acting like a "master" or "global" calendar for the user.
 *
 * @param {number} req.params.id - The ID of the event to retrieve (required).
 *
 * @returns {Event} The event object.
 */
routes.get('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Retrieve a list of all events (across all calendars) from the database (admin or same-user-as-calendar-owner minimum view-only authorization required).
 * An event is an instance constructed from the combination of a message and any number of hierarchically-ordered agendas.
 * Therefore, when retrieving a specific event, the response will contain the information from its originating agenda(s) + message, as well as its generated active and expire datetime values.
 * The event will also be tied to a calendar, so the user must have access to that calendar in order to retrieve the event.
 * If no specific event is specified, all events that the user has access to will be returned in a table (omitting their "payload" information), acting like a "master" or "global" calendar for the user.
 *
 * @returns {Event[]} An array of event objects, with agenda list and payloads ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Execute a transform function over the event (admin or same-user-as-calendar-owner minimum editor authorization required).
 * A transform function spawns a copy of the event's originating agenda(s), and applies a transformation to it.
 * The transformation causes the cron expressions of the agendas, along with related agendas (that may have the same parent agenda), to be shifted according to some specially-defined behavior.
 * For instance, the simple rotate transform orders the sub-agendas and shifts their cron expressions by one position, so that the first sub-agenda's time becomes the second, and so on, with the last sub-agenda's time becoming the first.
 * This is useful for bulk re-scheduling of events, when multiple events should depend on one another.
 * If other calendars depend on the same agendas, this will create a copy of the affected agendas.
 * Beware, however, this will cause the agendas to branch off.
 */
//routes.post('/transformer/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
//});

/**
 * Create a new calendar event (without going through creating a new agenda first) (admin or same-user-as-calendar-owner minimum editor authorization required).
 * WARNING: This endpoint is used by Cron, and should *only* be used by Cron.
 * That's because Cron is what actually manages timing (active and expiration times) and recurrences for events by default.
 * That means if an end user creates events using this endpoint, they will have to manage both the timing and recurrence patterns on their own.
 * In addition, the event will be lost in the event its calendar is refreshed from its templated agenda.
 * Use agendas for placing new events instead.
 * After the event is posted, the same request is proxied to all of the (optional) traps from the template agenda along with each of its parent's traps, as a form of webhook or push notification.
 *
 * @param {number} req.body.time.active - The (Unix) datetime at which the event becomes/became active (required). THIS IS ONLY FOR DISPLAY, and needs to be enforced either manually or by Cron, separately.
 * @param {number} req.body.time.expire - The (Unix) datetime at which the event expires/expired (optional). THIS IS ONLY FOR DISPLAY, and needs to be enforced either manually or by Cron, separately.
 * @param {number} req.body.message     - The ID of the message that the event uses for its title and payload (required).
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Delete a calendar event from the database, along with its recurrences (admin or same-user-as-calendar-owner minimum editor authorization required).
 * Unlike deleting an agenda, this does not persist on a calendar refresh.
 * After the event is deleted, the same request is proxied to all of the (optional) traps from the template agenda along with each of its parent's traps, as a form of webhook or push notification.
 *
 * @param {number} req.params.id - The ID of the event to delete (required).
 */
routes.delete('/recurrent/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Acknowledge a calendar event (admin or same-user-as-calendar-owner minimum maintain-only authorization required).
 * Acknowledging an event deletes it from the database, but does not delete its recurrences.
 * If Cron is used for timing management (the default), the Cron job used to place the event to the database will simply re-add it on the next run (by design).
 * After the event is deleted, the same request is proxied to all of the (optional) traps from the template agenda along with each of its parent's traps, as a form of webhook or push notification.
 *
 * @param {number} req.params.id - The ID of the event to acknowledge (required).
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});
