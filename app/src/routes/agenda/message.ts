import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { authorizeRoute } from '../common.js';
import { globals }        from '../../utility/common.js';

export const routes = express.Router({ mergeParams: true });

/**
 * Attach an existing message to an existing agenda (admin or same-user-as-owner minimum editor authorization required).
 * This will then become a new event when its agenda becomes active.
 *
 * @param {number} req.params.id - The ID of the message to attach to the agenda (required).
 */
routes.put('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Detach an existing message from an existing schedule agenda (admin or same-user-as-owner minimum editor authorization required).
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }
  
  return res.status(HttpStatusCode.NoContent).send();
});
