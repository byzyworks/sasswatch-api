import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';

import db from '../services/data/database.js';

import Calendar from './Calendar.js';
import Message  from './Message.js';

class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id:          CreationOptional<number>;
  declare active_time: number;
  declare expire_time: number | null;
  declare calendar_id: ForeignKey<Calendar['id']>;
  declare message_id:  ForeignKey<Message['id']>;
}

Event.init({
  id: {
    type:          DataTypes.INTEGER.UNSIGNED,
    allowNull:     false,
    primaryKey:    true,
    autoIncrement: true,
  },
  active_time: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  expire_time: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  calendar_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  message_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
},
{
  sequelize: db,
  modelName: 'Event',
});

Message.belongsTo(Event, {
  foreignKey: 'owner_id',
  targetKey:  'id',
  onDelete:   'CASCADE',
});

export default Event;
