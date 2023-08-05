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

interface IdSearchKey {
  id: number;
}

interface NameSearchKey {
  name: string;
}

// Note that getBasicUser() below depends on the keys here matching the column names in the database.
type ISearchKey = IdSearchKey | NameSearchKey;

interface IPrincipalView {
  name:    string;
  enabled: boolean;
}

interface IAssetView {
  id:     number;
  title?: string;
}

interface IUserView {
  id:         number;
  username:   string;
  roles:      IPrincipalView[];
  calendars?: IAssetView[];
  agendas?:   IAssetView[];
  messages?:  IAssetView[];
  enabled:    boolean;
}

export class UserView {
  constructor() { }

  private async getBasicUser(key: ISearchKey): Promise<IUserView | null> {
    const user_raw = await UserModel.findOne({
      where: {
        [Object.keys(key)[0]]: Object.values(key)[0],
      },
    });

    if (user_raw === null) {
      return null;
    }

    const user_roles: IPrincipalView[] = [ ];
    const user_roles_raw = await PrincipalModel.findAll({
      attributes: ['role', 'is_enabled'],
      where: {
        user_id: user_raw.id,
      },
      order: [
        ['role', 'ASC'],
      ]
    });
    for (const user_role_raw of user_roles_raw) {
      user_roles.push({
        name:    user_role_raw.role,
        enabled: user_role_raw.enabled,
      });
    }

    const user: IUserView = {
      id:       user_raw.id,
      username: user_raw.name,
      roles:    user_roles,
      enabled:  user_raw.enabled,
    };

    return user;
  };

  private async upgradeBasicUser(user: IUserView) {
    user.calendars = [ ];
    const calendars_raw = await CalendarModel.findAll({
      where: {
        owner_id: user.id,
      },
      order: [
        ['title', 'ASC'],
      ],
    });
    for (const calendar_raw of calendars_raw) {
      user.calendars.push({
        id: calendar_raw.id,
        title: calendar_raw.title ?? 'Untitled',
      });
    }

    user.agendas = [ ];
    const agendas_raw = await AgendaModel.findAll({
      where: {
        owner_id: user.id,
      },
      order: [
        ['title', 'ASC'],
      ],
    });
    for (const agenda_raw of agendas_raw) {
      user.agendas.push({
        id: agenda_raw.id,
        title: agenda_raw.title ?? 'Untitled',
      });
    }

    user.messages = [ ];
    const messages_raw = await MessageModel.findAll({
      where: {
        owner_id: user.id,
      },
      order: [
        ['title', 'ASC'],
      ],
    });
    for (const message_raw of messages_raw) {
      user.messages.push({
        id: message_raw.id,
        title: message_raw.title,
      });
    }
  }

  public async getOne(key: ISearchKey): Promise<IUserView | null> {
    const user = await this.getBasicUser(key);

    if (user === null) {
      return null;
    }

    await this.upgradeBasicUser(user);

    return user;
  }

  public async getAll(): Promise<IUserView[]> {
    const users: IUserView[] = [ ];
    const users_raw = await UserModel.findAll({
      attributes: ['name'],
      order: [
        ['name', 'ASC'],
      ],
    });
    for (const user_raw of users_raw) {
      const user = await this.getBasicUser({ name: user_raw.name });
      assert(user !== null, "This user was just queried; there's no good reason they can't be queried now.");

      users.push(user);
    }

    return users;
  }
}
