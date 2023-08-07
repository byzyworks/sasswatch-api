import { strict as assert } from 'assert';

import auth                        from '../services/auth/credentials.js';
import db                          from '../services/data/database.js';
import { AppError, error_handler } from '../utility/error.js';
import { logger }                  from '../utility/logger.js';

interface IIdSearchKey {
  id: number;
}

interface INameSearchKey {
  name: string;
}

type ISearchKey = IIdSearchKey | INameSearchKey;

interface IPrincipal {
  name:    string;
  enabled: boolean;
}

interface IAsset {
  id:     number;
  title?: string;
}

interface IUser {
  id:         number;
  username:   string;
  roles:      IPrincipal[];
  enabled:    boolean;
  calendars?: IAsset[];
  agendas?:   IAsset[];
  messages?:  IAsset[];
}

export class User {
  constructor() { }

  /**
   * Gets a basic user object with information that is sent in both GET requests.
   * 
   * @param key      The column used to locate the user (can be either the user's id or username, but only one or the other)
   * @param key.id   The user's id.
   * @param key.name The user's username.
   * 
   * @returns The user object (passwords ommitted) or undefined if the user does not exist.
   */
  private static async getBasicUser(key: ISearchKey): Promise<IUser | null> {
    // Get the user's profile.
    let user_raw;
    if ('id' in key) {
      user_raw = await db.get('SELECT * FROM User WHERE id = ?', key.id);
    } else {
      user_raw = await db.get('SELECT * FROM User WHERE name = ?', key.name);
    }

    // Check if the user exists, first.
    if (user_raw === undefined) {
      return null;
    }

    // Collect a list of the roles that the user has.
    const user_roles = [ ];
    const user_roles_raw = await db.all('SELECT role FROM Principal WHERE user_id = ?', user_raw.id);
    for (const role of user_roles_raw) {
      user_roles.push(role.role);
    }

    // Compile the user information object.
    const user: IUser = {
      id:       user_raw.id,
      username: user_raw.name,
      roles:    user_roles,
      enabled:  user_raw.enabled,
    };

    // Export the object.
    return user;
  }

  /**
   * Gets asset information for a specific user using the common "grab by owner_id" method.
   * 
   * @param owner_id Username to come up with a list of assets for.
   * @param table    The asset type itself identified by the SQL table name.
   * 
   * @returns The list of a particular set of assets owned by the user.
   */
  private static async getAssets(owner_id: number, table: string): Promise<IAsset[]> {
    // Collect a list of the particular type of asset that the user has.
    const assets: IAsset[] = [];
    const assets_raw = await db.all(`SELECT * FROM ${table} WHERE owner_id = ? ORDER BY title`, owner_id);
    for (const asset of assets_raw) {
      assets.push({ id: asset.id, title: asset.title });
    }

    // Export the asset list.
    return assets;
  }

  public static async select(key: ISearchKey): Promise<IUser | null> {
    // Get the user's profile.
    const user = await this.getBasicUser(key);

    // The user must exist, first.
    if (user === null) {
      return null;
    }

    // Get the user's owned assets to be sent with their default profile metadata.
    assert(user.id !== undefined, 'User ID information should be grabbed automatically from basic user profile.');
    user.calendars = await this.getAssets(user.id, 'Calendar');
    user.agendas   = await this.getAssets(user.id, 'Agenda');
    user.messages  = await this.getAssets(user.id, 'Message');

    // Export the user information object.
    return user;
  }

  public static async selectAll() {
    // Collect a list of all users with their basic profile information (excluding their owned assets).
    const users: IUser[] = [];
    const users_raw = await db.all('SELECT name FROM User ORDER BY name');
    for (const user_raw of users_raw) {
      const user = await this.getBasicUser({ name: user_raw.name });
      if (user !== null) {
        users.push(user);
      }
    }

    // Export the user list.
    return users;
  }
}
