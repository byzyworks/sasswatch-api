import { strict as assert } from 'assert';

import { Model, ModelStatic } from 'sequelize';

import AgendaModel                 from '../models/Agenda.js';
import CalendarModel               from '../models/Calendar.js';
import MessageModel                from '../models/Message.js';
import PrincipalModel              from '../models/Principal.js';
import UserModel                   from '../models/User.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

interface ISearchKey {
  id: number;
}

interface IMessageView {
  id:       number;
  owner?:   string;
  weight:   number;
  title:    string;
  payload?: string;
}

export class UserView {
  constructor() { }

  private async getMessage(key: ISearchKey): Promise<IMessageView | null> {
    const message_raw = await MessageModel.findOne({
      where: {
        id: key.id,
      },
      include: [
        {
          model: UserModel,
          as:    'owner',
        },
      ],
    });

    if (message_raw === null) {
      return null;
    }

    const message: IMessageView = {
      id:      message_raw.id,
      owner:   message_raw.owner,
      weight:  message_raw.weight,
      title:   message_raw.title,
      payload: message_raw.payload ?? undefined,
    };

    return message;
  };

  public async getOne(key: ISearchKey): Promise<IMessageView | null> {
    const user = await this.getMessage(key);

    if (user === null) {
      return null;
    }

    return user;
  }

  public async getAll(): Promise<IMessageView[]> {
    const messages: IMessageView[] = [ ];
    const messages_raw = await MessageModel.findAll({
      attributes: ['name'],
      order: [
        ['name', 'ASC'],
      ],
    });
    for (const message_raw of messages_raw) {
      const message = await this.getMessage({ id: message_raw.id });
      assert(message !== null, "This message was just queried; there's no good reason they can't be queried now.");

      delete message.payload;

      messages.push(message);
    }

    return messages;
  }
}
