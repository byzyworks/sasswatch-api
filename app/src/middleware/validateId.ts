import { HttpStatusCode } from 'axios';
import express            from 'express';

import { AppError } from '../utility/error.js';
import { logger }   from '../utility/logger.js';

/**
 * 
 */
export default (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id < 0) {
    logger.error(`A request was sent affecting an object with ID "${id}", but this is not a valid ID.`);
    return res.status(HttpStatusCode.BadRequest).send();
  }

  return next();
};

