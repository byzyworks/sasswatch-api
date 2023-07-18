import express from 'express';

import { globals } from '../utility/common.js';

interface User {
    id:         number;
    username:   string;
    authorize: {
        view: boolean;
        main: boolean;
        edit: boolean;
        root: boolean;
    };
    calendars?: number[];
    agendas?:   number[];
    messages?:  number[];
}

export const routes = express.Router();

/**
 * Authorization middleware for user routes.
 *
 * Makes sure the users being accessed are either the same user as the authenticated user, have the proper authorization type, or that the authenticated user is authorized as an admin.
 */
routes.use('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Retrieve a specific user's profile information (admin or same-user-as-owner minimum view-only authorization required).
 *
 * @param {string} req.params.username - The user principal to retrieve (required).
 *
 * @returns {User} The user object, with password hashes ommitted.
 */
routes.get('/:username', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Retrieve a list of all users (admin authorization always required).
 * Note that when retrieving users this way, the calendars, agendas, and messages of that user are not included.
 *
 * @returns {User[]} An array of user objects, with password hashes, owned calendars, agendas, and messages ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Create a new user (admin authorization always required).
 *
 * @param {string} req.body.username - The user principal to create (required) (must be unique).
 * @param {string} req.body.password - The main/read-write password to use for the new user, pre-hashed, base64 encoded (required).
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Create/change the administration password of a specific user (admin authorization always required).
 * Admin users have full read-write access to all users' calendars, agendas, messages, etc.
 * In addition, they can manage other users' accounts, including changing their passwords and deleting them.
 * Using this password allows full read-write access to all the user's calendars, agendas, messages, etc.
 * Setting this password effectively promotes the user as an admin, so long as they use this password with the proper authorization type set in their requests.
 *
 * @param {string} req.params.username - The user principal whose password to change (required).
 * @param {string} req.body.password   - The user's new password, pre-hashed, base64 encoded (required).
 */
routes.put('/:username/password/root', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Change the editor password of a specific user (admin or same-user-as-owner minimum editor authorization required).
 * Using this password allows full read-write access to all the user's own calendars, agendas, messages, etc.
 * This is the default password that all users (except the root user) must be provided with when they are created.
 * This command will also fail if the user is the root user, since only admin authorization is permitted for the root user.
 *
 * @param {string} req.params.username - The user principal whose password to change (required).
 * @param {string} req.body.password   - The user's new password, pre-hashed, base64 encoded (required).
 */
routes.put('/:username/password/edit', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Change (or create) the maintain-only password of a specific user (admin or same-user-as-owner minimum editor authorization required).
 * This will enable an alternative, moderate mode of accessing the user's calendars.
 * In this, read-only viewing of calendars and events is allowed, but read-write access is only allowed specifically for acknowledging events.
 * This refers to a specific endpoint for deleting individual events that have been added to the database after Cron processed their start time.
 * That also means that event recurrences cannot be deleted using this password, since Cron manages recurrences.
 * The use of this additional access level is for retaining this somewhat critical functionality without also allowing the full range of destructive edits over calendars, agendas, etc.
 * This command will also fail if the user is the root user, since only admin authorization is permitted for the root user.
 *
 * @param {string} req.params.username - The user principal whose password to change (required).
 * @param {string} req.body.password   - The user's new password, pre-hashed, base64 encoded (required).
 */
routes.put('/:username/password/main', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Change (or create) the view-only password of a specific user (admin or same-user-as-owner minimum editor authorization required).
 * This will enable an alternative, read-only mode of accessing the user's calendars.
 * In view-only access mode, the user can only view the user's calendars and events, but cannot make any edits.
 * This goes for acknowledging/deleting individual events as well. Use a maintain-only password to allow at least for this.
 * This command will also fail if the user is the root user, since only admin authorization is permitted for the root user.
 *
 * @param {string} req.params.username - The user principal whose password to change (required).
 * @param {string} req.body.password   - The user's new password, pre-hashed, base64 encoded (required).
 */
routes.put('/:username/password/view', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Delete the administration password of a specific user (admin or same-user-as-owner minimum editor authorization required).
 * This will disable admin/superuser access for the user, not enable password-less admin/superuser access.
 * In other words, the user, if they already had a password for admin authorization, will be demoted as a regular user.
 * This command will also fail if the user is the root user, since the root user cannot be demoted.
 *
 * @param {string} req.params.username - The user principal whose password to delete (required).
 */
routes.delete('/:username/password/root', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Delete the maintain-only password of a specific user (admin or same-user-as-owner minimum editor authorization required).
 * This will disable maintain-only access to the user's calendars, not enable password-less maintain-only access.
 *
 * @param {string} req.params.username - The user principal whose password to delete (required).
 */
routes.delete('/:username/password/edit', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Delete the view-only password of a specific user (admin or same-user-as-owner minimum editor authorization required).
 * This will disable view-only access to the user's calendars, not enable password-less view-only access.
 *
 * @param {string} req.params.username - The user principal whose password to delete (required).
 */
routes.delete('/:username/password/view', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});

/**
 * Delete a specific user's account (admin or same-user-as-owner minimum editor authorization required).
 * Beware that deleting a user will also delete all of their assets, including calendars, agendas, messages, etc.
 * Note that the root user cannot be deleted, even when authorized as an admin or authenticated as the root user itself.
 *
 * @param {string} req.params.username - The user principal to delete (required).
 */
routes.delete('/:username', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
});
