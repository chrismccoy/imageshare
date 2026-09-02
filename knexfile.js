/**
 * Knex configuration for the SQLite database.
 */

const path = require("path");

module.exports = {
  client: "sqlite3",
  connection: {
    filename: process.env.DB_PATH || path.join(__dirname, "db", "db.sqlite"),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, "db", "migrations"),
  },
  pool: {
    min: 1,
    max: 1,
    afterCreate(conn, done) {
      conn.serialize(() => {
        conn.run("PRAGMA journal_mode = WAL");
        conn.run("PRAGMA synchronous = NORMAL");
        conn.run("PRAGMA foreign_keys = ON", done);
      });
    },
  },
};
