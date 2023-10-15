import { HttpStatusCode } from 'axios';
import express            from 'express';

import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import model                       from '../models/Message.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';
import view                        from '../views/Message.js';

export class Message {
  public static async select(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = Number(req.params.id);

    let message;
    try {
      message = await view.select({ id: id });
    } catch (err) {
      return next(err);
    }

    if (message === null) {
      return res.status(HttpStatusCode.NotFound).send();
    }

    return res.status(HttpStatusCode.Ok).json(message);
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
    const id   = Number(req.params.id);
    const data = req.body;

    try {
      await model.update({ id: id }, data);
    } catch (err) {
      return next(err);
    }

    return res.status(HttpStatusCode.Ok).send();
  }

  public static async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = Number(req.params.id);

    try {
      await model.delete({ id: id });
    } catch (err) {
      return next(err);
    }

    return res.status(HttpStatusCode.NoContent).send();
  }
}
