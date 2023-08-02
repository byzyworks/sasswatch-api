import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

import db from '../services/data/database.js';

import Principal from './Principal.js';
import Message   from './Message.js';
import Agenda    from './Agenda.js';
import Calendar  from './Calendar.js';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id:      CreationOptional<number>;
  declare name:    string;
  declare enabled: boolean;
}

User.init({
  id: {
    type:          DataTypes.INTEGER.UNSIGNED,
    allowNull:     false,
    primaryKey:    true,
    autoIncrement: true,
  },
  name: {
    type:      DataTypes.STRING,
    allowNull: false,
    unique:    true,
  },
  enabled: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  }
},
{
  sequelize: db,
  modelName: 'User',
});

User.hasMany(Principal, {
  foreignKey: 'user_id',
  sourceKey:  'id',
  onDelete:   'CASCADE',
});

User.hasMany(Message, {
  foreignKey: 'owner_id',
  sourceKey:  'id',
  onDelete:   'CASCADE',
});

User.hasMany(Agenda, {
  foreignKey: 'owner_id',
  sourceKey:  'id',
  onDelete:   'CASCADE',
});

User.hasMany(Calendar, {
  foreignKey: 'owner_id',
  sourceKey:  'id',
  onDelete:   'CASCADE',
});

export default User;
