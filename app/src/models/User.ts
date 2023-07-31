import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

interface IPrincipal {
  name:     string;
  password: string;
  enabled:  boolean;
}

interface IUser {
  username: string;
  roles:    IPrincipal[];
  enabled:  boolean;
}

export class User {
  constructor() { }

  async insert(user: IUser) {
    await db.run('INSERT INTO User (name) VALUES (?)', req.body.username);
  }

  async update(id: number, user: IUser) {

  }

  async delete(id: number) {
    
  }
}
