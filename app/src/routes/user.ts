/**
 * Retrieve a specific user's profile information (excluding their passwords).
 *
 * @param {string} req.params.username The user to retrieve (required).
 *
 * @returns {User} The user object, with password hashes ommitted.
 */
routes.get('/:username', );

/**
 * Retrieve a list of all users, ommitting their passwords and various owned assets.
 *
 * @returns {User[]} An array of user objects, with password hashes, owned calendars, agendas, and messages ommitted.
 */
routes.get('/', );

/**
 * Create a new user, with no roles assigned.
 *
 * @param {string} req.body.username The user principal to create (required) (must be unique).
 */
routes.post('/', );

/**
 * Disable the user from authenticating, but do not delete it, keeping the password intact (an admin may be needed to re-enable it later).
 * 
 * @param {string} req.params.username The user to disable (required).
 */
routes.put('/:username/lock', );

/**
 * Enable the user for authentication, after it has been disabled.
 * 
 * @param {string} req.params.username The user to enable (required).
 */
routes.delete('/:username/lock', );

/**
 * Delete a specific user's account, as well as all of their assets, including calendars, agendas, messages, etc.
 *
 * @param {string} req.params.username The user to delete (required).
 */
routes.delete('/:username', );

/**
 * Disable the role from authorizing, but do not delete it, keeping the password intact (an admin may be needed to re-enable it later).
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 */
routes.put('/role/:role/lock', );

/**
 * Either give the user a new role by creating a password for them to access that role with, or updates the user's password for that role.
 * Note if an empty or no password is supplied, this is NOT equivalent to deleting the role. This will give them password-less access - effectively the opposite.
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 * @param {string} req.body.password   The user's new password, pre-hashed, base64 encoded (optional).
 */
routes.put('/role/:role/password', );

/**
 * Enable the role for authorization, after it has been disabled.
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 */
routes.delete('/role/:role/lock', );

/**
 * Delete the role from the user, along with the password they have for that role.
 * 
 * @param {string} req.params.username The user being affected (required).
 * @param {string} req.params.role     The user's role being affected (required). 
 */
routes.delete('/role/:role', );
