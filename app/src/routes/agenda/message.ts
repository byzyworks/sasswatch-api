import express from 'express';

import { globals } from '../../utility/common.js';

export const routes = express.Router();

/**
 * Attach an existing message to an existing agenda (admin or same-user-as-owner minimum editor authorization required).
 * This will then become a new event when its agenda becomes active.
 *
 * @param {number} req.params.id - The ID of the message to attach to the agenda (required).
 */
routes.post('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Detach an existing message from an existing schedule agenda (admin or same-user-as-owner minimum editor authorization required).
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});
