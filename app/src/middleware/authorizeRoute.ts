import { HttpStatusCode } from 'axios';
import express            from 'express';

import auth         from '../services/auth/credentials.js';
import roles        from '../services/auth/roles.js';
import db           from '../services/data/database.js';
import { AppError } from '../utility/error.js';
import { logger }   from '../utility/logger.js';

/**
 * Default route-level authorization method.
 * 
 * Checks if the role(s) in question can use the route where this is called.
 * 
 * @param roles The roles that are allowed to access the route.
 * 
 * @returns True if the user is authorized, false otherwise.
 */
export default (roles: string[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Checks the function's provided list of allowed roles against the user's authenticated role.
    const this_role = auth.role;
    for (const allowed_role of roles) {
      if (this_role === allowed_role) {
        return next();
      }
    }

    // Default deny.
    return res.status(HttpStatusCode.Forbidden).send();
  }
};
