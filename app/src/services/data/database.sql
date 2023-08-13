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

CREATE TABLE IF NOT EXISTS Calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  owner_id INTEGER NOT NULL,
  CONSTRAINT fk_owner_id
    FOREIGN KEY (owner_id)
    REFERENCES User(id)
    ON DELETE CASCADE
);

CREATE VIEW IF NOT EXISTS v_User_Calendar AS
  SELECT
    c.id AS id,
    u.name AS owner,
    c.title AS title
  FROM User u
  INNER JOIN Calendar c ON u.id = c.owner_id
;

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
  active_cron TEXT,
  expire_cron TEXT,
  is_immediate INTEGER NOT NULL DEFAULT 0,
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

CREATE VIEW IF NOT EXISTS v_User_Agenda AS
  SELECT
    a.id AS id,
    u.name AS owner,
    a.parent_id AS parent,
    a.title AS title,
    a.active_cron AS active_cron,
    a.expire_cron AS expire_cron,
    a.is_immediate AS is_immediate
  FROM User u
  INNER JOIN Agenda a ON u.id = a.owner_id
;

CREATE TABLE IF NOT EXISTS Calendar_Agenda (
  calendar_id INTEGER NOT NULL,
  agenda_id INTEGER NOT NULL,
  CONSTRAINT fk_calendar_id
    FOREIGN KEY (calendar_id)
    REFERENCES Calendar(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_agenda_id
    FOREIGN KEY (agenda_id)
    REFERENCES Agenda(id)
    ON DELETE CASCADE,
  CONSTRAINT pk_calendar_agenda
    PRIMARY KEY (calendar_id, agenda_id)
);

CREATE VIEW IF NOT EXISTS v_Calendar_Agenda AS
  SELECT
    ca.calendar_id AS calendar_id,
    ca.agenda_id AS agenda_id,
    c.title AS calendar_title,
    a.title AS agenda_title
  FROM Calendar_Agenda ca
  INNER JOIN Calendar c ON ca.calendar_id = c.id
  INNER JOIN Agenda a ON ca.agenda_id = a.id
;

CREATE TABLE IF NOT EXISTS Message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weight INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  payload TEXT,
  owner_id INTEGER NOT NULL,
  CONSTRAINT fk_owner_id
    FOREIGN KEY (owner_id)
    REFERENCES User(id)
    ON DELETE CASCADE
);

CREATE VIEW IF NOT EXISTS v_User_Message AS
  SELECT
    m.id AS id,
    u.name AS owner,
    m.weight AS weight,
    m.title AS title,
    m.payload AS payload
  FROM User u
  INNER JOIN Message m ON u.id = m.owner_id
;

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

CREATE VIEW IF NOT EXISTS v_Agenda_Message AS
  SELECT
    am.agenda_id AS agenda_id,
    am.message_id AS message_id,
    a.title AS agenda_title,
    m.title AS message_title
  FROM Agenda_Message am
  INNER JOIN Agenda a ON am.agenda_id = a.id
  INNER JOIN Message m ON am.message_id = m.id
;

CREATE TABLE IF NOT EXISTS Event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active_time INTEGER,
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

CREATE VIEW IF NOT EXISTS v_Event_Agenda AS
  SELECT
    ea.event_id AS event_id,
    ea.agenda_id AS agenda_id,
    ea.depth AS depth,
    a.title AS agenda_title
  FROM Event_Agenda ea
  INNER JOIN Agenda a ON ea.agenda_id = a.id

CREATE VIEW IF NOT EXISTS v_User_Calendar_Event_Message AS
  SELECT
    e.id AS id,
    u.name AS owner,
    e.calendar_id AS calendar_id,
    c.calendar_title AS calendar_title,
    e.active_time AS active_time,
    e.expire_time AS expire_time,
    m.id AS message,
    m.weight AS weight,
    m.title AS title,
    m.payload AS payload
  FROM Event e
  INNER JOIN Message m ON e.message_id = m.id
  INNER JOIN Calendar c ON e.calendar_id = c.id
  INNER JOIN User u ON c.owner_id = u.id
;
