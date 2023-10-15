import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

import * as common from './common.js';

interface ISearchKey {
  id: number;
}

interface IMessage {
  id: number;
}

interface IAgendaBase {
  parent?: number;
  title?:  string;
  cron?: {
    active?: string;
    expire?: string;
  };
  immediate?: boolean;
}

type IAgendaInsert = IAgendaBase & {
  messages?: IMessage[];
}

type IAgendaUpdate = IAgendaBase & {
  messages?: {
    append?: IMessage[];
    remove?: IMessage[];
  }
}

export default class Agenda {
  constructor() { }

  public static async insert(agenda: IAgendaInsert): Promise<number> {
    let mappings = new Map<string, common.Primitive>();
    mappings.set('parent_id', agenda.parent ?? null);
    mappings.set('title',     agenda.title  ?? null);
    if (agenda.cron !== undefined) {
      mappings.set('active_cron', agenda.cron.active ?? null);
      mappings.set('expire_cron', agenda.cron.expire ?? null);
    }
    mappings.set('is_immediate', agenda.immediate ?? false);

    const agenda_id = await common.insertMapped('Agenda', mappings);

    if (agenda.messages !== undefined) {
      mappings = new Map<string, common.Primitive>();
      mappings.set('agenda_id', agenda_id);

      for (const message of agenda.messages) {
        mappings.set('message_id', message.id);

        await common.insertMapped('Agenda_Message', mappings);
      }
    }

    return agenda_id;
  }

  public static async update(key: ISearchKey, agenda: IAgendaUpdate): Promise<number> {
    let mappings = new Map<string, common.Primitive>();
    if (agenda.parent !== undefined) {
      mappings.set('parent_id', agenda.parent);
    }
    if (agenda.title !== undefined) {
      mappings.set('title', agenda.title);
    }
    if (agenda.cron !== undefined) {
      if (agenda.cron.active !== undefined) {
        mappings.set('active_cron', agenda.cron.active);
      }
      if (agenda.cron.expire !== undefined) {
        mappings.set('expire_cron', agenda.cron.expire);
      }
    }
    if (agenda.immediate !== undefined) {
      mappings.set('is_immediate', agenda.immediate);
    }

    let where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    const agenda_id = await common.updateMappedWhere('Agenda', mappings, where);

    if (agenda.messages !== undefined) {
      mappings = new Map<string, common.Primitive>();
      mappings.set('agenda_id', agenda_id);

      for (const message of agenda.messages.append ?? []) {
        mappings.set('message_id', message.id);

        await common.insertMapped('Agenda_Message', mappings);
      }

      for (const message of agenda.messages.remove ?? []) {
        mappings.set('message_id', message.id);

        await common.deleteWhere('Agenda_Message', mappings);
      }
    }

    return agenda_id;
  }

  public static async delete(key: ISearchKey) {
    let where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    await common.deleteWhere('Agenda', where);
  }
}
