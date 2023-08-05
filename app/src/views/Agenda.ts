import { strict as assert } from 'assert';

import { Model, ModelStatic } from 'sequelize';

import auth                        from '../services/auth/credentials.js';
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
  id:    number;
  title: string;
}

interface IAgendaView {
  id:      number;
  parent?: number;
  owner?:  string;
  title?:  string;
  cron?: {
    active?: string;
    expire?: string;
  };
  messages?: IMessageView[];
  children?: Array<IAgendaView | number>;
}

export class Agenda {
  constructor() { }

  private async getBasicAgenda(key: ISearchKey): Promise<IAgendaView | null> {
    
  }

  private async getAgendaNested(source_agenda: IAgendaView, depth: number) {  
    let lineup: IAgendaView[] = [];
    lineup.push(source_agenda);
  
    for (let i = 0; i < depth; i++) {
      const source = (i === 0) ? source_agenda : lineup[lineup.length - 1];
  
      const parent_raw = await AgendaModel.findOne({
        where: {
          id: source_agenda.id,
        },
        include: [
          {
            model: UserModel,
            as:    'owner',
          },
        ],
      });

      if (parent_raw === null) {
        break;
      }
  
      const parent: IAgendaView = {
        id:    parent_raw.id,
        owner: parent_raw.owner,
        title: parent_raw.title ?? undefined,
        cron: {
          active: parent_raw.active_cron,
          expire: parent_raw.expire_cron ?? undefined,
        },
        children: [],
      };
  
      switch (auth.role) {
        case 'root':
        case 'audt':
          parent.owner = parent_raw.owner;
      }

      if (i === depth - 1) {
        parent.parent = parent_raw.parent_id;
      }
  
      lineup.push(parent);
    }
  
    return lineup;
  }

  private async upgradeAgendaMessages(source_agenda: IAgendaView) {
    source_agenda.messages = [];
  
    //const messages_raw = await globals.db.all('SELECT * FROM v_Agenda_Message WHERE parent = ? ORDER BY title', child.id);
    const messages_raw = await AgendaModel.findAll({
      where: {
        parent_id: source_agenda.id,
      },
      order: [
        ['title', 'ASC'],
      ],
      include: [
        {
          model: MessageModel,
          as:    'messages',
        },
      ],
    });

    for (const message_raw of messages_raw) {
      const message: IMessageView = {
        id:    message_raw.id,
        title: message_raw.title,
      };

      child.messages.push(message);
    }
  }
  
  private async upgradeAgendaChildren(source_agenda: IAgendaView, depth: number) {
    const children_raw = await AgendaModel.findAll({
      where: {
        parent_id: source_agenda.id,
      },
      order: [
        ['title', 'ASC'],
      ],
      include: [
        {
          model: UserModel,
          as:    'owner',
        },
      ],
    });
  
    let children: IAgendaView[] = [];
    for (const child_raw of children_raw) {
      const child: IAgendaView = {
        id:    child_raw.id,
        title: child_raw.title ?? undefined,
        cron: {
          active: child_raw.active_cron,
          expire: child_raw.expire_cron ?? undefined,
        }
      };
  
      switch (auth.role) {
        case 'root':
        case 'audt':
          child.owner = child_raw.owner;
      }
  
      
  
      child.children = [];
  
      if (depth > 0) {
        child.children = await getAgendaChildren(req, child, depth - 1);
      } else {
        const grandchildren_raw = await globals.db.all('SELECT * FROM v_Agenda_Message WHERE parent = ? ORDER BY title', child.id);
        for (const grandchild_raw of grandchildren_raw) {
          const grandchild: Agenda = {
            id:    child_raw.id,
            title: child_raw.title,
          };
  
          switch (req.credentials.roletype) {
            case 'root':
            case 'audt':
              grandchild.owner = grandchild_raw.owner;
          }
  
          child.children.push(grandchild);
        }
      }
  
      children.push(child);
    }
  
    return children;
  }

  public async getOne(key: ISearchKey, options: ISearchOptions): Promise<IAgendaView | null> {

  }

  public async getAll(): Promise<IAgendaView[]> {

  }
}