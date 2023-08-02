import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';

import db from '../services/data/database.js';

import User from './User.js';

class Principal extends Model<InferAttributes<Principal>, InferCreationAttributes<Principal>> {
  declare id:       CreationOptional<number>;
  declare user_id:  ForeignKey<User['id']>;
  declare role:     string;
  declare password: string;
  declare enabled:  boolean;
}

Principal.init({
  id: {
    type:          DataTypes.INTEGER.UNSIGNED,
    allowNull:     false,
    primaryKey:    true,
    autoIncrement: true,
  },
  user_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
  },
  role: {
    type:      DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type:      DataTypes.CHAR(60),
    allowNull: false,
  },
  enabled: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: true,
  },
},
{
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'role'],
    },
  ],
  sequelize: db,
  modelName: 'Principal',
});

export default Principal;
