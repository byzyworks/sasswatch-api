/**
 * The roletype is the authorization type requested by the user.
 * These are the role types that are currently supported by the application:
 *
 * "view" - View access         - Permits read-only access to the user's calendars and events. Agendas and messages are not necessary for normal viewing.
 * "main" - Maintainence access - Permits read access to the user's calendars and events, with the ability to acknowledge/delete singular events, clearing them out.
 * "edit" - Edit access         - Permits read-write access to all of the user's owned assets, including their calendars, events, agendas, and messages.
 * "root" - Admin access        - Permits read-write access to all assets, regardless of ownership. Unrestricted. Use with caution.
 * "cron" - Crontab access      - Permits adding and deleting individual events only. Specifically for Cron, i.e. internal use only.
 * "read" - User audit access   - Permits read-only access to all of the user's owned assets, including their calendars, events, agendas, and messages.
 * "audt" - Admin audit access  - Permits read-only access to all assets, regardless of ownership.
 *
 * Anything else is automatically 403'd.
 *
 * Every role requires a different (meaning separately-maintained) password from each other role.
 */
export default abstract class UserRole {
  public static VIEW       = 'view'
  public static MAINTAIN   = 'main'
  public static EDIT       = 'edit'
  public static ADMIN      = 'root'
  public static CRON       = 'cron'
  public static AUDIT_USER = 'read'
  public static AUDIT_ALL  = 'audt'
}

// freeze UserRole to prevent modification
Object.freeze(UserRole);
