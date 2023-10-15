import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

import * as common from './common.js';

interface ISearchKey {
  id: number;
}

interface IEvent {
  calendar: number;
  time: {
    active:  string;
    expire?: string;
  };
  message: number;
}

export default class Event {
  constructor() { }

  public static async insert(event: IEvent): Promise<number> {
    if (event.calendar === undefined) {
      throw new AppError('Event being created was not supplied with a calendar, which is required.', { is_fatal: false });
    }
    if ((event.time === undefined) || (event.time.active === undefined)) {
      throw new AppError('Event being created was not supplied with a start time, which is required.', { is_fatal: false });
    }
    if (event.message === undefined) {
      throw new AppError('Event being created was not supplied with a message, which is required.', { is_fatal: false });
    }

    let mappings = new Map<string, common.Primitive>();
    mappings.set('calendar_id', event.calendar);
    mappings.set('active_time', event.time.active);
    mappings.set('expire_time', event.time.expire ?? null);
    mappings.set('message_id',  event.message);

    const event_id = await common.insertMapped('Event', mappings);

    return event_id;
  }

  public static async update(key: ISearchKey, event: IEvent): Promise<number> {
    const mappings = new Map<string, common.Primitive>();
    if (event.calendar !== undefined) {
      mappings.set('calendar_id', event.calendar);
    }
    if (event.time !== undefined) {
      if (event.time.active !== undefined) {
        mappings.set('active_time', event.time.active);
      }
      if (event.time.expire !== undefined) {
        mappings.set('expire_time', event.time.expire);
      }
    }
    if (event.message !== undefined) {
      mappings.set('message_id', event.message);
    }

    const where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    const event_id = await common.updateMappedWhere('Event', mappings, where);

    return event_id;
  }

  public static async delete(key: ISearchKey) {
    const where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    await common.deleteWhere('Event', where);
  }
}
