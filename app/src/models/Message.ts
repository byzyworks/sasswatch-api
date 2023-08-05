import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';

import db from '../services/data/database.js';

import Agenda from './Agenda.js';
import User   from './User.js';

class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
  declare id:       CreationOptional<number>;
  declare weight:   number;
  declare title:    string;
  declare payload:  string | null;
  declare owner_id: ForeignKey<User['id']>;
}

Message.init({
  id: {
    type:          DataTypes.INTEGER.UNSIGNED,
    allowNull:     false,
    primaryKey:    true,
    autoIncrement: true,
  },
  weight: {
    type:         DataTypes.INTEGER.UNSIGNED,
    allowNull:    false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  title: {
    type:      DataTypes.STRING,
    allowNull: false,
  },
  payload: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  owner_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
},
{
  sequelize: db,
  modelName: 'Agenda',
});

Message.belongsToMany(Agenda, {
  through:    'Agenda_Message',
  foreignKey: 'message_id',
  otherKey:   'agenda_id',
  onDelete:   'CASCADE',
});

export default Message;
