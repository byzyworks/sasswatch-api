import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { authorizeRoute } from '../../authorizer.js';
import { globals }        from '../../utility/common.js';

export const routes = express.Router({ mergeParams: true });

/**
 * Attach an existing agenda to an existing calendar (admin or same-user-as-owner minimum editor authorization required).
 * When an agenda is attached to a calendar, it generates a series of Cron jobs to perform event CRUD operations.
 * The events generated are defined by the agenda's (and sub-agendas') cron expressions and its messages.
 *
 * @param {number} req.params.id - The ID of the agenda to attach to the calendar (required).
 */
routes.put('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Detach an existing message from an existing schedule agenda (admin or same-user-as-owner minimum editor authorization required).
 * Removal of the agenda from the calendar will delete the events as well as the Cron jobs associated with that agenda.
 * This is per calendar, and as such will have no effect on other calendars.
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  !authorizeRoute(req, ['edit', 'root']) && res.status(HttpStatusCode.Forbidden).send();

  return res.status(HttpStatusCode.NoContent).send();
});
