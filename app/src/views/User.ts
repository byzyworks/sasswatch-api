import auth                        from '../services/auth/credentials.js';
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
  calendars?: IAsset[];
  agendas?:   IAsset[];
  messages?:  IAsset[];
  enabled:    boolean;
}

export class User {
  constructor() { }

  /**
   * Gets a basic user object with information shared across all GET requests.
   * 
   * @param username Username to come up with a user object for.
   * 
   * @returns The user object (passwords ommitted) or null if the user does not exist.
   */
  private async getBasicUser(key: ISearchKey): Promise<IUser | null> {
    // Get the user's profile.
    const user_raw = await db.get(`SELECT * FROM User WHERE ${Object.keys(key)[0]} = ?`, Object.values(key)[0]);

    // Check if the user exists, first.
    if (user_raw === undefined) {
      return null;
    }

    // Collect a list of the roles that the user has.
    const user_roles: IPrincipal[] = [ ];
    const user_roles_raw = await db.all('SELECT role, is_enabled FROM Principal WHERE user_id = ? ORDER BY role', user_raw.id);
    for (const user_role_raw of user_roles_raw) {
      user_roles.push({
        name:    user_role_raw.role,
        enabled: user_role_raw.is_enabled === 1
      });
    }

    // Compile the user information object.
    const user: IUser = {
      id:       user_raw.id,
      username: user_raw.name,
      roles:    user_roles,
      enabled:  user_raw.is_enabled === 1
    };

    // Export the object.
    return user;
  };

  /**
   * Gets asset information for a specific user using the common "grab by owner_id" method.
   * 
   * @param owner_id Username to come up with a list of assets for.
   * @param table    The asset type itself identified by the SQL table name.
   * 
   * @returns The list of a particular set of assets owned by the user.
   */
  private async getUserAssets(owner_id: number, table: string): Promise<IAsset[]> {
    // Collect a list of the particular type of asset that the user has.
    const assets: IAsset[] = [ ];
    const assets_raw = await db.all(`SELECT * FROM ${table} WHERE owner_id = ? ORDER BY title`, owner_id);
    for (const asset_raw of assets_raw) {
      assets.push({
        id: asset_raw.id,
        title: asset_raw.title
      });
    }

    // Export the asset list.
    return assets;
  }

  async select(key: ISearchKey): Promise<IUser | null> {
    const user = await this.getBasicUser(key);

    if (user === null) {
      return null;
    }

    user.calendars = await this.getUserAssets(user.id, 'Calendar');
    user.agendas   = await this.getUserAssets(user.id, 'Agenda');
    user.messages  = await this.getUserAssets(user.id, 'Message');

    return user;
  }

  async selectAll(): Promise<IUser[]> {
    const users: IUser[] = [ ];
    const users_raw = await db.all('SELECT name FROM User ORDER BY name');
    for (const user_raw of users_raw) {
      //
      const user = await this.getBasicUser({ name: user_raw.name });

      // This code should never run; it's just here to satisfy TypeScript.
      if (user === null) {
        continue;
      }

      //
      users.push(user);
    }

    return users;
  }
}
