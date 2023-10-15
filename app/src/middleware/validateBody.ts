import { HttpStatusCode } from 'axios';
import express            from 'express';

import { AppError } from '../utility/error.js';
import { logger }   from '../utility/logger.js';

/**
 * 
 */
export default (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    JSON.parse(req.body);
  } catch (err) {
    logger.error('A request body was sent that is not a valid JSON object, and thus could not be parsed.');
    return res.status(HttpStatusCode.BadRequest).send();
  }

  return next();
};
