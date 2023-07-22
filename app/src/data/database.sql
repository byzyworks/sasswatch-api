CREATE TABLE IF NOT EXISTS User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Principal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES User(id),
  CONSTRAINT unique_role UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS Calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES User(id)
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
  FOREIGN KEY (agenda_id) REFERENCES Agenda(id)
);
*/

CREATE TABLE IF NOT EXISTS Agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active_cron TEXT NOT NULL,
  expire_cron TEXT,
  owner_id INTEGER NOT NULL,
  parent_id INTEGER,
  FOREIGN KEY (owner_id) REFERENCES User(id),
  FOREIGN KEY (parent_id) REFERENCES Agenda(id)
);

CREATE TABLE IF NOT EXISTS Message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  payload TEXT,
  owner_id INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES User(id)
);

/**
* Agendas can have multiple messages tied to them, just as messages can be re-used across multiple agendas.
*/
CREATE TABLE IF NOT EXISTS Agenda_Message (
  agenda_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  FOREIGN KEY (agenda_id) REFERENCES Agenda(id),
  FOREIGN KEY (message_id) REFERENCES Message(id),
  PRIMARY KEY (agenda_id, message_id)
);

CREATE TABLE IF NOT EXISTS Event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active_time INTEGER NOT NULL,
  expire_time INTEGER,
  calendar_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  FOREIGN KEY (calendar_id) REFERENCES Calendar(id),
  FOREIGN KEY (message_id) REFERENCES Message(id)
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
  FOREIGN KEY (event_id) REFERENCES Event(id),
  FOREIGN KEY (agenda_id) REFERENCES Agenda(id),
  PRIMARY KEY (event_id, agenda_id)
);
