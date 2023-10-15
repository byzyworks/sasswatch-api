import { strict as assert } from 'assert';

import auth                        from '../services/auth/credentials.js';
import UserRole                    from '../services/auth/roles.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

interface ISearchKey {
  id: number;
}

interface ICalendar {
  id:     number;
  title?: string;
}

interface IAgenda {
  id:     number;
  title?: string;
  depth:  number;
}

interface IEvent {
  id:     number;
  owner?: string;
  time: {
    active:  string;
    expire?: string;
  }
  calendar: ICalendar;
  agendas?: IAgenda[];
  message: {
    id:       number;
    weight:   number;
    title:    string;
    payload?: string;
  }
}

export default class Event {
  constructor() { }

  private static async getBasicEvent(key: ISearchKey): Promise<IEvent | null> {
    const event_raw = await db.get('SELECT * FROM v_User_Calendar_Event_Message WHERE id = ?', key.id);
    if (event_raw === undefined) {
      return null;
    }

    const event: IEvent = {
      id: event_raw.id,
      time: {
        active: event_raw.active_time,
        expire: event_raw.expire_time ?? null,
      },
      calendar: {
        id:    event_raw.calendar_id,
        title: event_raw.calendar_title ?? null,
      },
      message: {
        id:      event_raw.message,
        weight:  event_raw.weight,
        title:   event_raw.title,
        payload: event_raw.payload ?? null,
      },
    };

    switch (auth.role) {
      case UserRole.ADMIN:
      case UserRole.AUDIT_ALL:
        event.owner = event_raw.owner;
    }

    return event;
  }

  private static async getAgendas(key: ISearchKey): Promise<IAgenda[]> {
    const agendas: IAgenda[] = [ ];
    const agendas_raw = await db.all('SELECT agenda_id, agenda_title, depth FROM v_Event_Agenda WHERE event_id = ? ORDER BY depth, agenda_title, agenda_id', key.id);
    for (const agenda_raw of agendas_raw) {
      const agenda = {
        id:    agenda_raw.agenda_id,
        title: agenda_raw.agenda_title,
        depth: agenda_raw.depth,
      };

      agendas.push(agenda);
    }

    return agendas;
  }

  public static async select(key: ISearchKey): Promise<IEvent | null> {
    const event = await this.getBasicEvent(key);
    if (event === null) {
      return null;
    }

    event.agendas = await this.getAgendas(key);

    return event;
  }

  public static async selectAll() {
    const events: IEvent[] = [];
    const events_raw = await db.all('SELECT id, title FROM Event ORDER BY title, id');
    for (const event_raw of events_raw) {
      const event = await this.getBasicEvent({ id: event_raw.id });
      if (event === null) {
        break;
      }

      events.push(event);
    }

    return events;
  }
}
