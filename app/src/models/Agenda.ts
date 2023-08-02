import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';

import db from '../services/data/database.js';

import Message from './Message.js';
import User    from './User.js';

class Agenda extends Model<InferAttributes<Agenda>, InferCreationAttributes<Agenda>> {
  declare id:          CreationOptional<number>;
  declare title:       string | null;
  declare active_cron: string;
  declare expire_cron: string | null;
  declare owner_id:    ForeignKey<User['id']>;
  declare parent_id:   ForeignKey<Agenda['id']>;
}

Agenda.init({
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
  active_cron: {
    type:      DataTypes.STRING,
    allowNull: false,
  },
  expire_cron: {
    type:      DataTypes.STRING,
    allowNull: true,
  },
  owner_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  parent_id: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
},
{
  sequelize: db,
  modelName: 'Agenda',
});

Agenda.belongsTo(Agenda, {
  foreignKey: 'parent_id',
  targetKey:  'id',
  onDelete:   'SET NULL',
});

Agenda.belongsToMany(Message, {
  through:    'Agenda_Message',
  foreignKey: 'agenda_id',
  otherKey:   'message_id',
  onDelete:   'CASCADE',
});

export default Agenda;
