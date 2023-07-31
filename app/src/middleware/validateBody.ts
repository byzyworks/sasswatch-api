import { HttpStatusCode } from 'axios';
import express            from 'express';

import { AppError } from '../utility/error.js';
import { logger }   from '../utility/logger.js';

/**
 * 
 */
export default async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    JSON.parse(req.body);
  } catch (err) {
    logger.error('Failed to parse request body; not a valid JSON object.');
    return res.status(HttpStatusCode.BadRequest).send();
  }

  return next();
};
