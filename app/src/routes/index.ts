import { strict as assert } from 'assert';

import express from 'express';

import { globals }                  from '../utility/common.js';
import { routes as agendaRoutes }   from './agenda/index.js';
import { routes as calendarRoutes } from './calendar/index.js';
import { routes as messageRoutes }  from './message.js';
import { routes as userRoutes }     from './user.js';

export const routes = express.Router();

routes.use('/calendar', calendarRoutes);
routes.use('/agenda',   agendaRoutes);
routes.use('/message',  messageRoutes);
routes.use('/user',     userRoutes);

routes.use('/', (req: express.Request, res: express.Response) => {
    // Redirect to the user's profile by default.
    // Note the assert; the authentication middleware that should have run before this also should have filled out req.credentials already.
    assert(req.credentials !== undefined);
    res.redirect(`/user/${req.credentials.username}`);
});
