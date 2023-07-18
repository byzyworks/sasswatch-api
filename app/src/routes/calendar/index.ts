import express from 'express';

import { globals }                from '../../utility/common.js';
import { routes as agendaRoutes } from './agenda.js';
import { routes as eventRoutes }  from './event.js';

interface Event {
  id:        number;
  time: {
    active: string;
    expire: string;
  };
  message: number;
  title:   string;
}

interface Calendar {
  id:      number;
  owner:   string;
  events?: Event[];
}

export const routes = express.Router();

/**
 * Authorization middleware for calendar routes.
 *
 * Makes sure the authenticated user is authorized as an admin, or owns the message being accessed and is using the appropriate authorization for the given endpoint.
 */
routes.use('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Since events are tied to specific calendars, it makes intuitive sense to treat events as a sub-resource of calendars.
 *
 * @param {Object} req.params.id - The ID of the calendar parenting the event (required).
 */
routes.use('/:id/agenda', agendaRoutes);

/**
 * Since events are tied to specific calendars, it makes intuitive sense to treat events as a sub-resource of calendars.
 *
 * @param {Object} req.params.id - The ID of the calendar parenting the event (required).
 */
routes.use('/:id/event', eventRoutes);

/**
 * Retrieve a specific calendar from the database (admin or same-user-as-owner minimum view-only authorization required).
 * This is the endpoint that would normally be polled to look for new events.
 *
 * @param {Object} req.params.id - The ID of the calendar to retrieve (required).
 *
 * @returns {Calendar} The calendar object.
 */
routes.get('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Retrieve a list of all calendars from the database (admin or same-user-as-owner minimum view-only authorization required).
 * If the user is authorized as an admin, this includes all calendars in the database, regardless of owner.
 * If the user is authorized as anything less, this includes only the calendars owned by the authenticated user.
 * Note that when retrieving calendars this way, the events pertaining to each calendar are not included.
 *
 * @returns {Calendar[]} An array of calendar objects, with event list ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Copy an existing calendar (admin or same-user-as-owner minimum editor authorization required).
 * Both are the same operation, but refreshing involves using an existing ID (overwriting the existing calendar).
 *
 * @param {number} req.params.id - The ID of the calendar to refresh (optional).
 *
 * @returns {Calendar} The new calendar with its ID for further customization.
 */
routes.post('/clone/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Refresh an existing calendar (admin or same-user-as-owner minimum editor authorization required).
 * Both are the same operation, but refreshing involves using an existing ID (overwriting the existing calendar).
 *
 * @param {number} req.params.id - The ID of the calendar to refresh (optional).
 */
routes.post('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Create a new, empty calendar (admin or same-user-as-owner minimum editor authorization required).
 * Both are the same operation, but refreshing involves using an existing ID (overwriting the existing calendar).
 *
 * @returns {Calendar} The new calendar with its ID for further customization.
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Delete an existing calendar from the database (admin or same-user-as-owner minimum editor authorization required).
 * Deleting a calendar will also delete all associated events.
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});
