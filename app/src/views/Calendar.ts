import { strict as assert } from 'assert';

import auth                        from '../services/auth/credentials.js';
import UserRole                    from '../services/auth/roles.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

interface ISearchKey {
  id: number;
}

interface IAgenda {
  id:     number;
  title?: string;
}

interface IEvent {
  id: number;
  time: {
    active: string;
    expire: string;
  };
  message: {
    id:     number;
    weight: number;
    title:  string;
  }
}

interface ICalendar {
  id:       number;
  owner?:   string;
  title?:   string;
  agendas?: IAgenda[];
  events?:  IEvent[];
}

export class Calendar {
  constructor() { }

  private static async getBasicCalendar(key: ISearchKey): Promise<ICalendar | null> {
    const calendar_raw = await db.get('SELECT * FROM v_User_Calendar WHERE id = ?', key.id);
    if (calendar_raw === undefined) {
      return null;
    }

    const calendar: ICalendar = {
      id:    calendar_raw.id,
      title: calendar_raw.title,
    };

    switch (auth.role) {
      case UserRole.ADMIN:
      case UserRole.AUDIT_ALL:
        calendar.owner = calendar_raw.owner;
    }

    return calendar;
  }

  private static async getAgendas(key: ISearchKey): Promise<IAgenda[]> {
    const agendas: IAgenda[] = [ ];
    const agendas_raw = await db.all('SELECT agenda_id, agenda_title FROM v_Calendar_Agenda WHERE calendar_id = ? ORDER BY agenda_title, agenda_id', key.id);
    for (const agenda_raw of agendas_raw) {
      const agenda = {
        id:    agenda_raw.agenda_id,
        title: agenda_raw.agenda_title,
      };

      agendas.push(agenda);
    }

    return agendas;
  }

  private static async getEvents(key: ISearchKey): Promise<IEvent[]> {
    const events: IEvent[] = [ ];
    const events_raw = await db.all('SELECT * FROM v_Event_Message WHERE calendar = ? ORDER BY title, id', key.id);
    for (const event_raw of events_raw) {
      const event = {
        id:    event_raw.id,
        time: {
          active: event_raw.active,
          expire: event_raw.expire,
        },
        message: {
          id:     event_raw.message_id,
          weight: event_raw.weight,
          title:  event_raw.title,
        },
      };

      events.push(event);
    }

    return events;
  }     

  public static async select(key: ISearchKey): Promise<ICalendar | null> {
    const calendar = await this.getBasicCalendar(key);
    if (calendar === null) {
      return null;
    }

    calendar.agendas = await this.getAgendas(key);
    calendar.events  = await this.getEvents(key);

    return calendar;
  }

  public static async selectAll() {
    const calendars: ICalendar[] = [];
    const calendars_raw = await db.all('SELECT id, title FROM Calendar ORDER BY title, id');
    for (const calendar_raw of calendars_raw) {
      const calendar = await this.getBasicCalendar({ id: calendar_raw.id });
      if (calendar === null) {
        break;
      }

      calendars.push(calendar);
    }

    return calendars;
  }
}
