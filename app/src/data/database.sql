CREATE TABLE IF NOT EXISTS User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Principal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT fk_user_id
    FOREIGN KEY (user_id)
    REFERENCES User(id)
    ON DELETE CASCADE,
  CONSTRAINT uniq_user_role
    UNIQUE (user_id, role)
);

/*
CREATE VIEW IF NOT EXISTS v_User_Principal AS
  SELECT
    u.name AS name,
    p.role AS role,
    p.password AS password,
    p.is_enabled AS is_enabled
  FROM User u
  INNER JOIN Principal p ON u.id = p.user_id
;
*/

CREATE TABLE IF NOT EXISTS Calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  owner_id INTEGER NOT NULL,
  CONSTRAINT fk_owner_id
    FOREIGN KEY (owner_id)
    REFERENCES User(id)
    ON DELETE CASCADE
);

/**
* Traps are webhooks used for push notifications.
* Right now, all notifications are pull-based.
*/
/*
CREATE TABLE IF NOT EXISTS Trap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  protocol TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  agenda_id INTEGER NOT NULL,
  CONSTRAINT fk_agenda_id
    FOREIGN KEY (agenda_id)
    REFERENCES Agenda(id)
    ON DELETE CASCADE
);
*/

CREATE TABLE IF NOT EXISTS Agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  active_cron TEXT NOT NULL,
  expire_cron TEXT,
  owner_id INTEGER NOT NULL,
  parent_id INTEGER,
  CONSTRAINT fk_owner_id
    FOREIGN KEY (owner_id)
    REFERENCES User(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_parent_id
    FOREIGN KEY (parent_id)
    REFERENCES Agenda(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  payload TEXT,
  weight INTEGER NOT NULL DEFAULT 1,
  owner_id INTEGER NOT NULL,
  CONSTRAINT fk_owner_id
    FOREIGN KEY (owner_id)
    REFERENCES User(id)
    ON DELETE CASCADE
);

/**
* Agendas can have multiple messages tied to them, just as messages can be re-used across multiple agendas.
*/
CREATE TABLE IF NOT EXISTS Agenda_Message (
  agenda_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  CONSTRAINT fk_agenda_id
    FOREIGN KEY (agenda_id)
    REFERENCES Agenda(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_message_id
    FOREIGN KEY (message_id)
    REFERENCES Message(id)
    ON DELETE CASCADE,
  CONSTRAINT pk_agenda_message
    PRIMARY KEY (agenda_id, message_id)
);

CREATE TABLE IF NOT EXISTS Event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active_time INTEGER NOT NULL,
  expire_time INTEGER,
  calendar_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  CONSTRAINT fk_calendar_id
    FOREIGN KEY (calendar_id)
    REFERENCES Calendar(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_message_id
    FOREIGN KEY (message_id)
    REFERENCES Message(id)
    ON DELETE CASCADE
);

/**
* Required to tie events back to the agendas (and messages) they originally were created from.
* In a multi-level agenda, an event will associate with multiple agendas, each with a different depth.
* A depth of 0 means the associated event's message is a direct child of the agenda, 1 being a child of a direct sub-agenda, and so on.
*/
CREATE TABLE IF NOT EXISTS Event_Agenda (
  event_id INTEGER NOT NULL,
  agenda_id INTEGER NOT NULL,
  depth INTEGER NOT NULL,
  CONSTRAINT fk_event_id
    FOREIGN KEY (event_id)
    REFERENCES Event(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_agenda_id
    FOREIGN KEY (agenda_id)
    REFERENCES Agenda(id)
    ON DELETE CASCADE,
  CONSTRAINT pk_event_agenda
    PRIMARY KEY (event_id, agenda_id)
);

CREATE VIEW IF NOT EXISTS v_Event_Message AS
  SELECT
    c.calendar_id AS calendar_id,
    e.active_time AS active_time,
    e.expire_time AS expire_time,
    m.title AS title,
    m.payload AS payload
  FROM Event e
  INNER JOIN Message m ON e.message_id = m.id
;
