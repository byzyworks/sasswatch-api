import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

import * as common from './common.js';

interface ISearchKey {
  id: number;
}

interface IAgenda {
  id: number;
}

interface ICalendarBase {
  title?: string;
}

type ICalendarInsert = ICalendarBase & {
  agendas?: IAgenda[];
}

type ICalendarUpdate = ICalendarBase & {
  agendas?: {
    append?: IAgenda[];
    remove?: IAgenda[];
  }
}

export default class Calendar {
  constructor() { }

  public static async insert(calendar: ICalendarInsert): Promise<number> {
    let mappings = new Map<string, common.Primitive>();
    mappings.set('title', calendar.title ?? null);

    const calendar_id = await common.insertMapped('Calendar', mappings);

    if (calendar.agendas !== undefined) {
      mappings = new Map<string, common.Primitive>();
      mappings.set('calendar_id', calendar_id);

      for (const agenda of calendar.agendas) {
        mappings.set('agenda_id', agenda.id);
        await common.insertMapped('CalendarAgenda', mappings);
      }
    }

    return calendar_id;
  }

  public static async update(key: ISearchKey, calendar: ICalendarUpdate): Promise<number> {
    let mappings = new Map<string, common.Primitive>();
    if (calendar.title !== undefined) {
      mappings.set('title', calendar.title);
    }

    let where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    const calendar_id = await common.updateMappedWhere('Calendar', mappings, where);

    if (calendar.agendas !== undefined) {
      mappings.set('calendar_id', calendar_id);

      if (calendar.agendas.append !== undefined) {
        for (const agenda of calendar.agendas.append) {
          mappings.set('agenda_id', agenda.id);
          await common.insertMapped('Calendar_Agenda', mappings);
        }
      }

      if (calendar.agendas.remove !== undefined) {
        for (const agenda of calendar.agendas.remove) {
          mappings.set('agenda_id', agenda.id);
          await common.deleteWhere('Calendar_Agenda', mappings);
        }
      }
    }

    return calendar_id;
  }

  public static async delete(key: ISearchKey) {
    let where = new Map<string, common.Primitive>();
    where.set('id', key.id);

    await common.deleteWhere('Calendar', where);
  }
}
