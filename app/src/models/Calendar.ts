import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';

import db from '../services/data/database.js';

import Event from './Event.js';
import User  from './User.js';

class Calendar extends Model<InferAttributes<Calendar>, InferCreationAttributes<Calendar>> {
  declare id:       CreationOptional<number>;
  declare title:    string | null;
  declare owner_id: ForeignKey<User['id']>;
}

Calendar.init({
  id: {
    type:          DataTypes.INTEGER.UNSIGNED,
    allowNull:     false,
    primaryKey:    true,
    autoIncrement: true,
  },
  title: {
    type:      DataTypes.STRING,
    allowNull: true,
  },
  owner_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
},
{
  sequelize: db,
  modelName: 'Calendar',
});

Calendar.hasMany(Event, {
  foreignKey: 'calendar_id',
  sourceKey:  'id',
  onDelete:   'CASCADE'
});

export default Calendar;
