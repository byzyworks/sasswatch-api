import { strict as assert } from 'assert';

import express         from 'express';

import { globals }  from './utility/common.js';
import { AppError } from './utility/error.js';
import { logger }   from './utility/logger.js';

/**
 * Default resource-level authorization method.
 * 
 * Route-level authorization is handled separately on a more role-centric than user-centric basis.
 * 
 * @param req   The request object containing the user credentials. Credentials not sent directly so the assert check can be consolidated here.
 * @param table The name of the entity (SQL table) being accessed.
 * 
 * @returns True if the user is authorized, false otherwise.
 */
export const authorizeResource = async (req: express.Request, table: string) => {
  // To prevent TypeScript from complaining even though these resources have already been initialized.
  assert(req.credentials !== undefined);
  assert(globals.db      !== undefined);

  // Allows access to all resources regardless of ownership when authorized as an admin.
  // Cron is allowed ownership-free access too since it's internal. However, its route-level authorization is narrowed to only some event routes.
  const role = req.credentials.roletype;
  if ((role === 'root') || (role === 'cron')) {
    return true;
  }

  // For everyone else, the user must own the resource to access it.
  // While ACLs could permit sharing, they can be implemented at a higher level using roles.
  // To implement them discretionarily with granting and revoking like they are in SQL would likely be a nightmare.
  const user_id = (await globals.db.get(`SELECT owner_id FROM ${table} WHERE id = ?`, req.params.id)).owner_id;
  const user    = (await globals.db.get(`SELECT name FROM User WHERE id = ?`, user_id)).name;
  if (user === req.credentials.username) {
    return true;
  }

  // Default deny.
  return false;
};

/**
 * Default route-level authorization method.
 * 
 * Checks if the role(s) in question can use the route where this is called.
 * 
 * @param req   The request object containing the user credentials. Credentials not sent directly so the assert check can be consolidated here.
 * @param roles The roles that are allowed to access the route.
 * 
 * @returns True if the user is authorized, false otherwise.
 */
export const authorizeRoute = async (req: express.Request, roles: Array<string>) => {
  // To prevent TypeScript from complaining even though these resources have already been initialized.
  assert(req.credentials !== undefined);

  // Checks the function's provided list of allowed roles against the user's authenticated role.
  const this_role = req.credentials.roletype;
  for (const allowed_role of roles) {
    if (this_role === allowed_role) {
      return true;
    }
  }

  // Default deny.
  return false;
};