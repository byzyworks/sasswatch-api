import { HttpStatusCode } from 'axios';
import express            from 'express';

import auth         from '../services/auth/credentials.js';
import roles        from '../services/auth/roles.js';
import db           from '../services/data/database.js';
import { AppError } from '../utility/error.js';
import { logger }   from '../utility/logger.js';

/**
 * Default resource-level authorization method.
 * 
 * Route-level authorization is handled separately on a more role-centric than user-centric basis.
 * 
 * @param table The name of the entity (SQL table) being accessed.
 * 
 * @returns True if the user is authorized, false otherwise.
 */
export default async (table: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Allows access to all resources regardless of ownership when authorized as an admin.
    // Cron is allowed ownership-free access too since it's internal. However, its route-level authorization is narrowed to only some event routes.
    switch (auth.role) {
      case roles.ADMIN:
      case roles.CRON:
      case roles.AUDIT_ALL:
        return next();
    }

    // For everyone else, the user must own the resource to access it.
    // While ACLs could permit sharing, they can be implemented at a higher level using roles.
    // To implement them discretionarily with granting and revoking like they are in SQL would likely be a nightmare.
    const user_id = (await db.get(`SELECT owner_id FROM ${table} WHERE id = ?`, req.params.id)).owner_id;
    const user    = (await db.get(`SELECT name FROM User WHERE id = ?`, user_id)).name;
    if (user === auth.username) {
      return next();
    }

    // Default deny.
    return res.status(HttpStatusCode.Forbidden).send();
  }
};
