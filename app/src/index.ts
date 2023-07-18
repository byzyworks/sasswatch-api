#!/usr/bin/env node

import { Option, program } from 'commander';

import { AppError, error_handler } from './utility/error.js';
import { transports, logger }      from './utility/logger.js';
import { server }                  from './server.js';

process.exitCode = 0;

process.on('uncaughtException', error => {
  error_handler.handle(error);
});

process.on('unhandledRejection', error => {
  if (error instanceof AppError) {
    error_handler.handle(error);
  } else {
    error_handler.handle(new AppError(`Unhandled promise rejection: ${error}`));
  }
});

program
  .name('SASSwatch API')
  .description('Specialized database management for portable, hierarchical, tree-like data files.')
  .version('1.0.0')
  .addOption(
    new Option('-4, --ipv4-only', 'Disable binding on IPv6 when in server mode.')
      .conflicts('ipv6Only')
  )
  .addOption(
    new Option('-6, --ipv6-only', 'Disable binding on IPv4 when in server mode.')
      .conflicts('ipv4Only')
  )
  .addOption(
    new Option('-L, --localhost', 'Bind only to localhost; do not expose raw service to the network.')
  )
  .addOption(
    new Option('-P, --server-port <port>', 'The port number to bind to.')
      .default(7575)
      .argParser((value) => {
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 65535) {
          throw new AppError('Not a valid port number.', { is_fatal: true });
        }
        return parsedValue;
      })
  )
  // Traps are currently unimplemented.
  /*
  .addOption(
    new Option('-T, --enable-traps', 'Enable trap (P2P server-to-client) notifications.')
  )
  .addOption(
    new Option('-t, --trap-timeout <msec>', 'The amount of time to wait in milliseconds before a TCP trap expires.')
      .default(3000)
  )
  */
  .addOption(
    new Option('-v, --verbose', 'Enable verbose logging output.')
  )
  .hook('preAction', async () => {
    const options = program.opts();

    if (options.verbose) {
      transports.console.level = 'debug';
      logger.verbose('Console log level set to debugging.');
    }

    // Set global program options.
    options.ipv4Only    ? process.env.IPV4_ONLY      = 'true' : process.env.IPV4_ONLY      = 'false';
    options.ipv6Only    ? process.env.IPV6_ONLY      = 'true' : process.env.IPV6_ONLY      = 'false';
    if (options.ipv4Only && options.ipv6Only) {
      throw new AppError('Cannot enable both IPv4-only and IPv6-only modes simultaneously.', { is_fatal: true });
    }
    options.localhost   ? process.env.LOCALHOST_ONLY = 'true' : process.env.LOCALHOST_ONLY = 'false';
    //options.enableTraps ? process.env.ENABLE_TRAPS   = 'true' : process.env.ENABLE_TRAPS   = 'false';
    //process.env.TRAP_TIMEOUT = options.trapTimeout.toString();
    process.env.SERVER_PORT  = options.serverPort.toString();
  })
;

program
  .action(async () => {
    await server();
  })
;

program.parse(process.argv);
