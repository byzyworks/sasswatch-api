import { HttpStatusCode } from 'axios';
import express            from 'express';

import authorizeRoute from '../middleware/authorizeRoute.js';

export const routes = express.Router({ mergeParams: true });

routes.get('/:id',
    authorizeRoute(['edit', 'root', 'read', 'audt']),
);

routes.get('/',
    authorizeRoute(['edit', 'root', 'read', 'audt']),
);

routes.post('/',
    authorizeRoute(['edit', 'root']),
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
