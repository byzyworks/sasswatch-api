import { HttpStatusCode } from 'axios';
import express            from 'express';

import authorizeRoute from '../middleware/authorizeRoute.js';

export const routes = express.Router({ mergeParams: true });

routes.get('/:id',
    authorizeRoute(['view', 'main', 'edit', 'root', 'read', 'audt']),
);

routes.get('/',
    authorizeRoute(['root', 'audt']),
);

routes.post('/',
    authorizeRoute(['root']),
);

routes.put('/:id',
    authorizeRoute(['edit', 'root']),
);

routes.patch('/:id',
    authorizeRoute(['edit', 'root']),
);

routes.delete('/:id',
    authorizeRoute(['edit', 'root']),
);
