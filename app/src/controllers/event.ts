import { HttpStatusCode } from 'axios';
import express            from 'express';

import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

export default async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    
};
