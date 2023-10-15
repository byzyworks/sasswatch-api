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
export default (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Allows access to all users when authorized as an admin.
  switch (auth.role) {
    case roles.ADMIN:
    case roles.AUDIT_ALL:
      return next();
  }

  // Non-admins only need to be able to access their own user profile.
  const user = auth.username;
  if (user === req.params.username) {
    return next();
  }

  // Default deny.
  return res.status(HttpStatusCode.Forbidden).send();
};
