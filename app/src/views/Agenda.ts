import { strict as assert } from 'assert';

import auth                        from '../services/auth/credentials.js';
import UserRole                    from '../services/auth/roles.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

interface ISearchKey {
  id:      number;
  height?: number;
  depth?:  number;
}

interface IAsset {
  id:     number;
  title?: string;
}

interface IAgenda {
  id:      number;
  parent?: number;
  owner?:  string;
  title?:  string;
  cron?: {
    active?: string;
    expire?: string;
  };
  immediate?: boolean;
  messages?:  IAsset[];
  calendars?: IAsset[];
  children?:  IAgenda[];
}

export default class Agenda {
  constructor() { }

  private static async getBasicAgenda(key: ISearchKey): Promise<IAgenda | null> {
    const agenda_raw = await db.get('SELECT * FROM v_User_Agenda WHERE id = ?', key.id);
    if (agenda_raw === undefined) {
      return null;
    }

    const agenda: IAgenda = {
      id:     agenda_raw.id,
      parent: agenda_raw.parent_id,
      title:  agenda_raw.title,
      cron: {
        active: agenda_raw.active_cron,
        expire: agenda_raw.expire_cron,
      },
      immediate: agenda_raw.is_immediate,
    };

    switch (auth.role) {
      case UserRole.ADMIN:
      case UserRole.AUDIT_ALL:
        agenda.owner = agenda_raw.owner;
    }

    return agenda;
  }

  private static async getMessages(key: ISearchKey): Promise<IAsset[]> {
    const messages: IAsset[] = [ ];
    const messages_raw = await db.all('SELECT message_id, message_title FROM v_Agenda_Message WHERE agenda_id = ? ORDER BY message_title, message_id', key.id);
    for (const message_raw of messages_raw) {
      const message = {
        id:    message_raw.message_id,
        title: message_raw.message_title,
      };

      messages.push(message);
    }

    return messages;
  }

  private static async getCalendars(key: ISearchKey): Promise<IAsset[]> {
    const calendars: IAsset[] = [ ];
    const calendars_raw = await db.all('SELECT calendar_id, calendar_title FROM v_Calendar_Agenda WHERE agenda_id = ? ORDER BY calendar_title, calendar_id', key.id);
    for (const calendar_raw of calendars_raw) {
      const calendar = {
        id:    calendar_raw.calendar_id,
        title: calendar_raw.calendar_title,
      };

      calendars.push(calendar);
    }

    return calendars;
  }

  private static async getMainAgenda(key: ISearchKey): Promise<IAgenda | null> {
    const agenda = await this.getBasicAgenda(key);
    if (agenda === null) {
      return null;
    }

    agenda.messages  = await this.getMessages(key);
    agenda.calendars = await this.getCalendars(key);

    return agenda;
  }

  /**
   * 
   */
  private static async getAgendaParents(source_agenda: IAgenda, height: number): Promise<IAgenda[]> {
    let lineup: IAgenda[] = [ ];
    lineup.push(source_agenda);

    // Traverse the agenda's parents to the given height.
    for (let i = 1; i <= height; i++) {
      const source = lineup[lineup.length - 1];

      const parent = await this.getBasicAgenda({ id: source.parent! });
      if (parent === null) {
        break;
      }

      delete source.parent;

      lineup.push(parent);
    }

    return lineup;
  }

  /**
   *
   */
  private static async getAgendaChildren(source_agenda: IAgenda, depth: number): Promise<IAgenda[]> {
    const children_raw = await db.all('SELECT * FROM v_User_Agenda WHERE parent = ? ORDER BY title, id', source_agenda.id);
    if (children_raw === undefined) {
      return [ ];
    }

    const children: IAgenda[] = [ ];
    if (depth > 0) {
      for (const child_raw of children_raw) {
        const child: IAgenda = {
          id:    child_raw.id,
          title: child_raw.title,
          cron: {
            active: child_raw.cron_active,
            expire: child_raw.cron_expire,
          },
          immediate: child_raw.is_immediate,
        };

        switch (auth.role) {
          case UserRole.ADMIN:
          case UserRole.AUDIT_ALL:
            child.owner = child_raw.owner;
        }

        child.messages = await this.getMessages({ id: child.id });

        child.children = await this.getAgendaChildren(child, depth - 1);
      }
    } else {
      for (const child_raw of children_raw) {
        const child: IAgenda = {
          id:    child_raw.id,
          title: child_raw.title,
        };
  
        switch (auth.role) {
          case UserRole.ADMIN:
          case UserRole.AUDIT_ALL:
            child.owner = child_raw.owner;
        }

        children.push(child);
      }
    }

    return children;
  }

  public static async select(key: ISearchKey): Promise<IAgenda | null> {
    const agenda = await this.getMainAgenda(key);
    if (agenda === null) {
      return null;
    }

    agenda.children = await this.getAgendaChildren(agenda, key.depth ?? 0);

    const parents = await this.getAgendaParents(agenda, key.height ?? 0);
    for (let i = 1; i < parents.length; i++) {
      parents[i].children = [ parents[i - 1] ];
    }
    const root_agenda = parents[parents.length - 1];

    return root_agenda;
  }

  public static async selectAll() {
    const agendas: IAgenda[] = [];
    const agendas_raw = await db.all('SELECT id, title FROM Agenda ORDER BY title, id');
    for (const agenda_raw of agendas_raw) {
      const agenda = await this.getBasicAgenda({ id: agenda_raw.id });
      if (agenda === null) {
        break;
      }

      agendas.push(agenda);
    }

    return agendas;
  }
}
