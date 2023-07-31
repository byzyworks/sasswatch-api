import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { routes as agendaRoutes }   from './agenda/index.js';
import { routes as calendarRoutes } from './calendar/index.js';
import { routes as messageRoutes }  from './message/index.js';
import { routes as userRoutes }     from './user/index.js';

export const routes = express.Router({ mergeParams: true });

routes.use('/calendar', calendarRoutes);
routes.use('/agenda',   agendaRoutes);
routes.use('/message',  messageRoutes);
routes.use('/user',     userRoutes);

routes.use('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return res.status(HttpStatusCode.NotFound).send();
});
