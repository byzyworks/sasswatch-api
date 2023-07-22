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

  // Hold the server in a non-functional, but still listening state if a 'fatal' error has occurred.
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
  app.use(error_handler.errorResponse);
  //app.use(migrator);

  // Up goes the servers.
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
