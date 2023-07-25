import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { authorizeResource, authorizeRoute } from '../../authorizer.js';
import { globals }                           from '../../utility/common.js';
import { routes as agendaRoutes }            from './agenda.js';
import { routes as eventRoutes }             from './event.js';

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
  title?:  string;
  events?: Event[];
}

export const routes = express.Router({ mergeParams: true });

/**
 * Does resource-level authorization for calendar and event routes.
 * 
 * In other words, this is for discretionary authorization that depends on the user's ownership rights.
 * Role-specific route authorization has to be handled at each route.
 */
routes.use('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeResource(req, 'Calendar') && res.status(HttpStatusCode.Forbidden).send();
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
  !authorizeRoute(req, ['view', 'main', 'edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
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
  !authorizeRoute(req, ['view', 'main', 'edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Copy an existing calendar (admin or same-user-as-owner minimum editor authorization required).
 * Both are the same operation, but refreshing involves using an existing ID (overwriting the existing calendar).
 *
 * @param {number} req.params.id - The ID of the calendar to refresh (optional).
 *
 * @returns {Calendar} The new calendar with its ID for further customization.
 */
routes.post('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Created).send();
});

/**
 * Create a new, empty calendar (admin or same-user-as-owner minimum editor authorization required).
 * Both are the same operation, but refreshing involves using an existing ID (overwriting the existing calendar).
 *
 * @returns {Calendar} The new calendar with its ID for further customization.
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Created).send();
});

/**
 * Refresh an existing calendar (admin or same-user-as-owner minimum editor authorization required).
 * Both are the same operation, but refreshing involves using an existing ID (overwriting the existing calendar).
 *
 * @param {number} req.params.id - The ID of the calendar to refresh (optional).
 */
routes.put('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Delete an existing calendar from the database (admin or same-user-as-owner minimum editor authorization required).
 * Deleting a calendar will also delete all associated events.
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();
  
  return res.status(HttpStatusCode.NoContent).send();
});
