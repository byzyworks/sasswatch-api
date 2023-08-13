import bcrypt from 'bcrypt';

import auth                        from '../services/auth/credentials.js';
import UserRole                    from '../services/auth/roles.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

import * as common from '../models/common.js';

interface IIdSearchKey {
  id: number;
}

interface INameSearchKey {
  name: string;
}

type ISearchKey = IIdSearchKey | INameSearchKey;

interface IPrincipal {
  name?:     string;
  password?: string;
  enabled?:  boolean;
}

interface IUser {
  username?: string;
  roles?:    IPrincipal[];
  enabled?:  boolean;
}

export class User {
  constructor() { }

  public static async insert(user: IUser) {
    if (user.username === undefined) {
      throw new AppError('User being created was not supplied with a username, which is required.', { is_fatal: false });
    }

    // Insert the user's profile.

    let mappings = new Map<string, common.Primitive>();
    mappings.set('name',       user.username);
    mappings.set('is_enabled', user.enabled ?? true);

    let user_id;
    try {
      user_id = await common.insertMapped('User', mappings);
    } catch (err) {
      throw new AppError(`User "${user.username}" could not be created.`, { is_fatal: false, cause: err });
    }

    // Insert the user's roles.

    if (user.roles === undefined) {
      return;
    }

    for (const role of user.roles) {
      if (role.name === undefined) {
        throw new AppError('A role name was not specified, which is required.', { is_fatal: false });
      }

      mappings = new Map<string, common.Primitive>();
      mappings.set('user_id',    user_id);
      mappings.set('role',       role.name);
      mappings.set('password',   await bcrypt.hash(role.password ?? '', 10));
      mappings.set('is_enabled', role.enabled ?? true);

      try {
        await common.insertMapped('Principal', mappings);
      } catch (err) {
        throw new AppError(`User "${user.username}" role "${role.name}" could not be created.`, { is_fatal: false, cause: err });
      }
    }
  }

  public static async update(key: ISearchKey, user: IUser) {
    // Update the user's profile.

    let mappings = new Map<string, common.Primitive>();
    if (user.username !== undefined) {
      mappings.set('name', user.username);
    }
    if (user.enabled !== undefined) {
      mappings.set('is_enabled', user.enabled);
    }

    let where = new Map<string, common.Primitive>();
    if ('id' in key) {
      where.set('id', key.id);
    } else {
      where.set('name', key.name);
    }

    let user_id;
    try {
      user_id = await common.updateMappedWhere('User', mappings, where);
    } catch (err) {
      throw new AppError(`User "${user.username}" could not be updated.`, { is_fatal: false, cause: err });
    }

    // Update/insert the user's roles.

    if (user.roles === undefined) {
      return;
    }

    for (const role of user.roles) {
      if (role.name === undefined) {
        throw new AppError(`User "${user.username}" role being updated was not supplied with a role name, which is required`, { is_fatal: false });
      }

      let where = new Map<string, common.Primitive>();
      where.set('user_id', user_id);
      where.set('role',    role.name);

      mappings = new Map<string, common.Primitive>();
      mappings.set('user_id', user_id);
      mappings.set('role',    role.name);
      if (role.password !== undefined) {
        mappings.set('password', await bcrypt.hash(role.password, 10));
      }
      if (role.enabled !== undefined) {
        mappings.set('is_enabled', role.enabled);
      }
      
      if (await common.exists('Principal', where)) {
        await common.updateMappedWhere('Principal', mappings, where);
      } else {
        await common.insertMapped('Principal', mappings);
      }
    }
  }

  public static async delete(key: ISearchKey) {
    const where = new Map<string, common.Primitive>();
    if ('id' in key) {
      where.set('id', key.id);
    } else {
      where.set('name', key.name);
    }

    await common.deleteWhere('User', where);

    // All user assets and roles will be deleted automatically due to ON DELETE CASCADE properties in database.sql.
  }
}
