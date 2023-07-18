import express from 'express';
import helmet  from 'helmet';

import { authenticator }      from './authenticator.js';
import { boostrap }           from './data/bootstrap.js';
import { globals }            from './utility/common.js';
import { routes }             from './routes/index.js';
import { error_handler }      from './utility/error.js';
import { logger, httpLogger } from './utility/logger.js';

export const server = async () => {
  // Add in the environment variables (they are pre-validated).
  const ipv4_only       = process.env.IPV4_ONLY === 'true';
  const ipv6_only       = process.env.IPV6_ONLY === 'true';
  const localhost       = process.env.LOCALHOST_ONLY === 'true';
  const server_port     = Number(process.env.SERVER_PORT);
  const max_connections = 511; // Currently, this is just to give a name to the required parameter below (default value used).

  // Create the Express app.
  const app = express();

  // Handle possible errors at the very beginning.
  app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (process.exitCode === 0) {
      next();
    } else {
      error_handler.errorResponse(request, response);
    }
  });

  // Other people's logic:
  app.use(helmet());
  app.use(httpLogger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize the database.
  globals.db = await boostrap();

  // Our app's logic:
  app.use(authenticator);
  app.use(routes);
  //app.use(migrator);

  /**
   * Keep in mind the behavior for the localhost-based and exposed servers is slightly different.
   * The localhost server is used for automatic runtime communications from Cron.
   * For its sake, the server voids authentication altogether for localhost requests.
   *
   * The purpose of this is three-fold:
   * - To allow Cron to make API requests without storing potentially sensitive credentials in plaintext.
   * - To not need to have the server constantly be able to retrieve those credentials to create new Cron jobs.
   * - To avoid needing to install additional third party software for Cron to directly interface with the server's SQLite database, alternatively.
   *
   * The username and authorization type are still parsed, but passwords are ignored.
   * 
   * To have continued security on the same host machine, run the server in a container or dedicated virtual machine.
   * 
   * This is planned to change in the future, likely through a dedicated "cron" user and "cron" role.
   */
  if (localhost) {
    if (!ipv6_only) {
      app.listen(server_port, '127.0.0.1', max_connections, () => {
        logger.info(`SASSwatch API listening on 127.0.0.1:${process.env.SERVER_PORT}`);
      });
    }
    if (!ipv4_only) {
      app.listen(server_port, '::1', max_connections, () => {
        logger.info(`SASSwatch API listening on [::1]:${process.env.SERVER_PORT}`);
      });
    }
  } else {
    if (!ipv6_only) {
      app.listen(server_port, '0.0.0.0', max_connections, () => {
        logger.info(`SASSwatch API listening on 0.0.0.0:${process.env.SERVER_PORT}`);
      });
    }
    if (!ipv4_only) {
      app.listen(server_port, '::1', max_connections, () => {
        logger.info(`SASSwatch API listening on [::]:${process.env.SERVER_PORT}`);
      });
    }
  }
};

export default server;
