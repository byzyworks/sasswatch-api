import { strict as assert } from 'assert';

import { HttpStatusCode } from 'axios';
import express            from 'express';

import { authorizeResource, authorizeRoute } from '../../middleware/authorizeRoute.js';
import { globals }                           from '../../services/auth/roles.js';
import { routes as messageRoutes }           from './message.js';
//import { routes as trapRoutes }              from './trap';

interface Message {
  id:    number;
  title: string;
}

interface Agenda {
  id:      number;
  parent?: number;
  owner?:  string;
  title?:  string;
  cron?: {
    active?: string;
    expire?: string;
  };
  messages?: Message[];
  children?: Array<Agenda | number>;
}

export const routes = express.Router({ mergeParams: true });

/**
 * Does resource-level authorization for agenda routes.
 * 
 * In other words, this is for discretionary authorization that depends on the user's ownership rights.
 * Role-specific route authorization has to be handled at each route.
 * 
 * @param {number} req.params.id The ID of the agenda being authorized (required).
 */
routes.use('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeResource(req, 'Agenda'))) {
    return next();
  }

  return res.status(HttpStatusCode.Forbidden).send();
});

/**
 * While there is another message route, this one affects specifically how this agenda uses them.
 * Messages are deliberately cross-agenda, so that particularly large payloads and specific can be reused.
 *
 * @param {number} req.params.id The ID of the agenda linked to the messages (required).
 */
routes.use('/:id/message', messageRoutes);

/**
 * Traps are webhooks that are triggered when a specific event occurs, and are used for push notifications.
 * They are configured per agenda, which then gets tied to specific calendars and events.
 * As of currently, all notifications are pull/polling-based, but it makes sense for this to change in the future.
 * 
 * @param {number} req.params.id The ID of the agenda linked to the traps (required).
 */
//routes.use('/:id/trap', trapRoutes);

/**
 * 
 */
const getAgendaParents = async (req: express.Request, source_agenda: Agenda, depth: number): Promise<Agenda[]> => {
  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  let lineup: Agenda[] = [];
  lineup.push(source_agenda);

  // Traverse the agenda's parents to the given depth.
  for (let i = 0; i < depth; i++) {
    const source: any = (i === 0) ? source_agenda : lineup[lineup.length - 1];

    const parent_raw = await globals.db.get('SELECT * FROM v_User_Agenda WHERE id = ?', source.parent);
    if (parent_raw === undefined) {
      break;
    }

    const parent: Agenda = {
      id:    parent_raw.id,
      owner: parent_raw.owner,
      title: parent_raw.title,
      cron: {
        active: parent_raw.cron_active,
        expire: parent_raw.cron_expire
      },
      children: []
    };

    switch (req.credentials.roletype) {
      case 'root':
      case 'audt':
        parent.owner = parent_raw.owner;
    }

    // Just state the parent's parent ID once the depth limit is reached.
    if (i === depth - 1) {
      parent.parent = parent_raw.parent;
    }

    lineup.push(parent);
  }

  return lineup;
}

/**
 *
 */
const getAgendaChildren = async (req: express.Request, source_agenda: Agenda, depth: number): Promise<Agenda[]> => {
  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  const children_raw = await globals.db.all('SELECT * FROM v_User_Agenda WHERE parent = ? ORDER BY title', source_agenda.id);
  if (children_raw === undefined) {
    return [];
  }

  let children: Agenda[] = [];

  for (const child_raw of children_raw) {
    const child: Agenda = {
      id:    child_raw.id,
      title: child_raw.title,
      cron: {
        active: child_raw.cron_active,
        expire: child_raw.cron_expire
      }
    };

    switch (req.credentials.roletype) {
      case 'root':
      case 'audt':
        child.owner = child_raw.owner;
    }

    child.messages = [];

    const messages_raw = await globals.db.all('SELECT * FROM v_Agenda_Message WHERE parent = ? ORDER BY title', child.id);
    for (const message_raw of messages_raw) {
      const message: Message = {
        id:    message_raw.id,
        title: message_raw.title
      };

      child.messages.push(message);
    }

    child.children = [];

    if (depth > 0) {
      child.children = await getAgendaChildren(req, child, depth - 1);
    } else {
      const grandchildren_raw = await globals.db.all('SELECT * FROM v_Agenda_Message WHERE parent = ? ORDER BY title', child.id);
      for (const grandchild_raw of grandchildren_raw) {
        const grandchild: Agenda = {
          id:    child_raw.id,
          title: child_raw.title,
        };

        switch (req.credentials.roletype) {
          case 'root':
          case 'audt':
            grandchild.owner = grandchild_raw.owner;
        }

        child.children.push(grandchild);
      }
    }

    children.push(child);
  }

  return children;
}

/**
 * Retrieve a specific agenda from the database, along with its parent and child agendas to given depths (admin or same-user-as-owner minimum editor authorization required).
 * 
 * This will retrieve the agenda showing its parent ID (the way it is stored in the database).
 *
 * @param {number} req.params.id     The ID of the agenda to retrieve (required).
 * @param {number} req.query.parents The depth in which to traverse the agenda tree towards the root to retrieve the agenda's parents (optional, defaults to 0).
 * @param {number} req.query.depth   The depth in which to traverse the agenda tree towards the leaves to retrieve the agenda's children (optional, defaults to 0).
 *
 * @returns {Agenda} The agenda object with its messages and the ID of its parent.
 */
routes.get('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root', 'read', 'audt']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  let parent_depth: number = (req.query.parents === undefined) ? 0 : parseInt(req.query.parents as string);
  let child_depth:  number = (req.query.depth   === undefined) ? 0 : parseInt(req.query.depth   as string);
  if (isNaN(parent_depth) || isNaN(child_depth)) {
    return res.status(HttpStatusCode.BadRequest).send();
  }

  assert(globals.db !== undefined);

  const agenda_raw = await globals.db.get('SELECT * FROM Agenda WHERE id = ?', req.params.id);

  const this_agenda: Agenda = {
    id:      agenda_raw.id,
    owner:   agenda_raw.owner,
    title:   agenda_raw.title,
    cron: {
      active: agenda_raw.cron_active,
      expire: agenda_raw.cron_expire
    },
    messages: [],
    children: []
  };

  //
  const lineup = await getAgendaParents(req, this_agenda, parent_depth);

  // De-serialize the parent agendas into a tree.
  for (let i = 0; i < lineup.length; i++) {
    const parent = lineup[i];
    if (i !== 0) {
      assert(parent.children !== undefined);
      parent.children.push(lineup[i - 1]);
    }
  }

  //
  const root = lineup[lineup.length - 1];

  //
  this_agenda.children = await getAgendaChildren(req, this_agenda, child_depth);

  //
  return res.status(HttpStatusCode.Ok).json(root);
});

/**
 * Retrieve a list of all agendas from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @returns {Agenda[]} An array of agenda objects, with message lists ommitted.
 */
routes.get('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root', 'read', 'audt']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  let agendas_raw;
  switch (req.credentials.roletype) {
    case 'root':
    case 'audt':
      agendas_raw = await globals.db.all('SELECT * FROM v_User_Agenda ORDER BY title');
      break;
    default:
      agendas_raw = await globals.db.all('SELECT * FROM v_User_Agenda WHERE name = ? ORDER BY title', req.credentials.username);
      break;
  }
  
  const message_list: Message[] = [];
  for (const message_raw of agendas_raw) {
    const message: Message = {
      id:     message_raw.id,
      title:  message_raw.title
    };

    message_list.push(message);
  }

  return res.status(HttpStatusCode.Ok).json(message_list);
});

/**
 * Copy an existing agenda to a new agenda (admin or same-user-as-owner minimum editor authorization required).
 * The default is to shallow-copy the existing agenda and keep it linked to the source agenda's existing sub-agendas, messages, etc.
 * This can be modified to varying degrees of depth.
 *
 * @param {number} req.params.id   The ID of the agenda to copy (required).
 * @param {number} req.query.depth The depth in which to traverse the agenda tree towards the leaves to copy the agenda's children (optional, defaults to 0).
 *
 * @returns {Agenda} The new agenda with its ID for further customization.
 */
routes.post('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  if (req.body.title === undefined) {
    return res.status(HttpStatusCode.BadRequest).send();
  }

  await globals.db.run('INSERT INTO Message (owner_id, title) VALUES (?, ?)', req.credentials.id, req.body.title);
  
  const message_id = await globals.db.get('SELECT id FROM Message WHERE title = ?', req.body.title);
  return res.status(HttpStatusCode.Created).send(message_id);
});

/**
 * Create a new agenda (admin or same-user-as-owner minimum editor authorization required).
 * An agenda is used as a template for calendars, as well as sub-collections of events.
 * Agendas carry recurrence information, which gets used to form Cron jobs.
 * The Cron jobs are then used to generate events, which are then tied to the calendars themselves.
 *
 * @returns {Agenda} The new agenda with its ID for further customization.
 */
routes.post('/', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(req.credentials !== undefined);
  assert(globals.db !== undefined);

  await globals.db.run('INSERT INTO Agenda (owner_id) VALUES (?)', req.credentials.id);
  
  const agenda_id = await globals.db.get('SELECT id FROM Agenda WHERE title = ?', req.body.title);
  return res.status(HttpStatusCode.Created).json(agenda_id);
});

/**
 * Edit an existing agenda's parent identifier in the database (admin or same-user-as-owner minimum editor authorization required).
 * The parent agenda creates a reference time frame for all it's sub-agendas.
 * Sub-agendas are not incorporated into a calendar (as new events) until the parent agenda becomes active.
 * Subsequently, sub-agenda-spawned events are removed from the calendar when the parent agenda expires.
 * To nullify/remove the parent, use the DELETE method instead.
 * Note that calendars that use this agenda need to be refreshed in order to reflect the changes.
 *
 * @param {number} req.params.id   The ID of the (child) agenda to edit (required).
 * @param {number} req.body.parent The ID of the parent agenda (required).
 */
routes.put('/:id/parent', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Edit an existing agenda's activating cron expression in the database (admin or same-user-as-owner minimum editor authorization required).
 * The activating cron expression is used by Cron to determine when the agenda's events (formed by its messages and sub-agenda messages) should be added to the database, and subsequently, to the calendars.
 * The activating cron expression cannot be nullified/deleted, as a starting point is always required.
 * Note that calendars that use this agenda need to be refreshed in order to reflect the changes.
 *
 * @param {number} req.params.id The ID of the agenda to edit (required).
 * @param {string} req.body.cron The cron expression for when the agenda should activate (required).
 */
routes.put('/:id/cron/active', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Edit an existing agenda's expiring cron expression in the database (admin or same-user-as-owner minimum editor authorization required).
 * The expiring cron expression is used by Cron to determine when the agenda's events (formed by its messages and sub-agenda messages) should be deleted from the database, and subsequently, from the calendars.
 * To nullify/remove the expiring cron expression, use the DELETE method instead.
 * Note that calendars that use this agenda need to be refreshed in order to reflect the changes.
 *
 * @param {number} req.params.id The ID of the agenda to edit (required).
 * @param {string} req.body.cron The cron expression for when the agenda should expire (required).
 */
routes.put('/:id/cron/expire', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);

  return res.status(HttpStatusCode.Ok).send();
});

/**
 * Delete an existing agenda's parent identifier from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @param {number} req.params.id The ID of the agenda's parent to remove (required).
 */
routes.delete('/:id/parent', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);

  return res.status(HttpStatusCode.NoContent).send();
});

/**
 * Delete an existing agenda's expiring cron expression from the database (admin or same-user-as-owner minimum editor authorization required).
 *
 * @param {number} req.params.id The ID of the agenda's expiring cron expression to remove (required).
 */
routes.delete('/:id/cron/expire', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);

  return res.status(HttpStatusCode.NoContent).send();
});

/**
 * Delete an existing agenda from the database (admin or same-user-as-owner minimum editor authorization required).
 * The default is to shallow-delete the existing agenda and ignore the agenda's existing sub-agendas.
 * This can be modified to varying degrees of depth.
 * When the agenda is deleted, so will all of the agenda's associated events and the Cron jobs used to active and expire them.
 * Note that this will *not* delete the agenda's linked messages. The messages form an event's "content"; the agenda only forms the event's context/time window.
 * However, this means that any calendars that use this agenda will not be able to refresh without also losing the events the agenda would have spawned.
 *
 * @param {number} req.params.id   The ID of the agenda to delete (required).
 * @param {number} req.query.depth The depth in which to traverse the agenda tree towards the leaves to delete the agenda's children (optional, defaults to 0).
 */
routes.delete('/:id', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(await authorizeRoute(req, ['edit', 'root']))) {
    return res.status(HttpStatusCode.Forbidden).send();
  }

  assert(globals.db !== undefined);
  
  return res.status(HttpStatusCode.NoContent).send();
});
