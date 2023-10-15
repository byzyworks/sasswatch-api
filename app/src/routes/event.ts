import { HttpStatusCode } from 'axios';
import express            from 'express';

import authorizeRoute from '../middleware/authorizeRoute.js';

export const routes = express.Router({ mergeParams: true });

routes.get('/:id',
    authorizeRoute(['view', 'main', 'edit', 'root', 'read', 'audt']),
);

routes.get('/',
    authorizeRoute(['edit', 'root', 'read', 'audt']),
);

routes.post('/',
    authorizeRoute(['cron']),
);

routes.delete('/recurrent/:id',
    authorizeRoute(['edit', 'root']),
);

routes.delete('/:id',
    authorizeRoute(['main', 'edit', 'root', 'cron']),
);
