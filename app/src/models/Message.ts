import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

import * as common from './common.js';

interface ISearchKey {
  id: number;
}

interface IMessage {
  weight?:  number;
  title?:   string;
  payload?: string;
}

export default class Message {
  constructor() { }

  public static async insert(message: IMessage): Promise<number> {
    if (message.title === undefined) {
      throw new AppError('Message being created was not supplied with a title, which is required.', { is_fatal: false });
    }

    let mappings = new Map<string, common.Primitive>();
    mappings.set('weight', message.weight ?? 1);
    mappings.set('title',  message.title);
    mappings.set('payload', message.payload ?? null);

    const message_id = await common.insertMapped('Message', mappings);

    return message_id;
  }

  public static async update(key: ISearchKey, message: IMessage): Promise<number> {
    if (message.title === undefined) {
      throw new AppError('Message being created was not supplied with a title, which is required.', { is_fatal: false });
    }

    const mappings = new Map<string, common.Primitive>();
    if (message.weight !== undefined) {
      mappings.set('weight', message.weight);
    }
    if (message.title !== undefined) {
      mappings.set('title', message.title);
    }
    if (message.payload !== undefined) {
      mappings.set('payload', message.payload);
    }

    const where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    const message_id = await common.updateMappedWhere('Message', mappings, where);

    return message_id;
  }

  public static async delete(key: ISearchKey) {
    const where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    await common.deleteWhere('Message', where);
  }
}
