import { AppError } from '../../utility/error.js';
import { logger }   from '../../utility/logger.js';

class Credentials {
  #id?:   number;
  #user?: string;
  #role?: string;
  #pass?: string;

  constructor() { }

  public initialize(auth_header?: string) {
    // Divide the auth header into its (three) components.
    const token = (auth_header || '').split(' ')[1] || '';

    // Rule out any invalid requests.
    if (token === undefined) {
      throw new AppError('Invalid authorization token sent.', { is_fatal: false });
    }

    // Decode the HTTP Basic Auth token.
    const http_credentials   = Buffer.from(token, 'base64').toString().split(':');
    const http_name_and_role = http_credentials[0].split(' ');

    // Fill the credentials.
    this.#user = http_name_and_role[0];
    this.#role = http_name_and_role[1];
    this.#pass = http_credentials[1];
  }

  public get id() {
    return this.#id || -1;
  }

  public set id(id: number) {
    this.#id = id;
  }

  public get username() {
    return this.#user;
  }

  public get role() {
    return this.#role;
  }

  public get password() {
    return this.#pass;
  }
}

export default new Credentials();
