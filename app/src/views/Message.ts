import { strict as assert } from 'assert';

import auth                        from '../services/auth/credentials.js';
import UserRole                    from '../services/auth/roles.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

interface ISearchKey {
  id: number;
}

interface IAsset {
  id:     number;
  title?: string;
}

interface IMessage {
  id:       number;
  owner?:   string;
  weight:   number;
  title:    string;
  payload?: string;
  agendas?: IAsset[];
  events?:  IAsset[];
}

export default class Message {
  constructor() { }

  private static async getBasicMessage(key: ISearchKey): Promise<IMessage | null> {
    const message_raw = await db.get('SELECT * FROM v_User_Agenda WHERE id = ?', key.id);
    if (message_raw === undefined) {
      return null;
    }

    const message: IMessage = {
      id:      message_raw.id,
      weight:  message_raw.weight,
      title:   message_raw.title,
      payload: message_raw.payload,
    };

    switch (auth.role) {
      case UserRole.ADMIN:
      case UserRole.AUDIT_ALL:
        message.owner = message_raw.owner;
    }

    return message;
  }

  private static async getAgendas(key: ISearchKey): Promise<IAsset[]> {
    const agendas: IAsset[] = [ ];
    const agendas_raw = await db.all('SELECT agenda_id, agenda_title FROM v_Agenda_Message WHERE message_id = ? ORDER BY agenda_title, agenda_id', key.id);
    for (const agenda_raw of agendas_raw) {
      const agenda = {
        id:    agenda_raw.agenda_id,
        title: agenda_raw.agenda_title,
      };

      agendas.push(agenda);
    }

    return agendas;
  }

  private static async getEvents(key: ISearchKey): Promise<IAsset[]> {
    const events: IAsset[] = [ ];
    const events_raw = await db.all('SELECT id FROM Event WHERE message_id = ? ORDER BY id', key.id);
    for (const event_raw of events_raw) {
      const event = {
        id: event_raw.id,
      };

      events.push(event);
    }

    return events;
  }

  public static async select(key: ISearchKey): Promise<IMessage | null> {
    const message = await this.getBasicMessage(key);
    if (message === null) {
      return null;
    }

    message.agendas = await this.getAgendas(key);
    message.events  = await this.getEvents(key);

    return message;
  }

  public static async selectAll() {
    const messages: IMessage[] = [];
    const messages_raw = await db.all('SELECT id, title FROM Message ORDER BY title, id');
    for (const message_raw of messages_raw) {
      const message = await this.getBasicMessage({ id: message_raw.id });
      if (message === null) {
        break;
      }

      messages.push(message);
    }

    return messages;
  }
}
