import * as sqlite from 'sqlite';
import sqlite3     from 'sqlite3';

interface Globals {
    db?: sqlite.Database<sqlite3.Database, sqlite3.Statement>;
}

export const globals: Globals = { };
