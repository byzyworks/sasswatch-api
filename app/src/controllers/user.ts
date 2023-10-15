import { HttpStatusCode } from 'axios';
import express            from 'express';

import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { existsWhere }                  from '../models/common.js';
import model                       from '../models/User.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';
import view                        from '../views/User.js';

export class User {
  public static async select(req: express.Request, res: express.Response, next: express.NextFunction) {
    const username = req.params.username;

    let user;
    try {
      user = await view.select({ name: username });
    } catch (err) {
      return next(err);
    }

    if (user === null) {
      return res.status(HttpStatusCode.NotFound).send();
    }

    return res.status(HttpStatusCode.Ok).json(user);
  }

  public static async selectAll(req: express.Request, res: express.Response, next: express.NextFunction) {
    let users;
    try {
      users = await view.selectAll();
    } catch (err) {
      return next(err);
    }

    return res.status(HttpStatusCode.Ok).json(users);
  }

  public static async insert(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = req.body;

    let result;
    try {
      result = await model.insert(data);
    } catch (err) {
      return next(err);
    }

    return res.status(HttpStatusCode.Ok).json({ id: result });
  }

  public static async update(req: express.Request, res: express.Response, next: express.NextFunction) {
    const username = req.params.username;
    const data     = req.body;

    try {
      await model.update({ name: username }, data);
    } catch (err) {
      return next(err);
    }

    return res.status(HttpStatusCode.Ok).send();
  }

  public static async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const username = req.params.username;

    try {
      await model.delete({ name: username });
    } catch (err) {
      return next(err);
    }

    return res.status(HttpStatusCode.NoContent).send();
  }
}


