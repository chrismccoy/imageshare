/**
 * Database access layer for images.
 */

const db = require("../lib/db");

const TABLE = "images";

const findByKey = (key) => db(TABLE).where("key", key).first();

const findById = (id) => db(TABLE).where("id", id).first();

const insert = async (data) => {
  try {
    const [id] = await db(TABLE).insert(data);
    return id;
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      const dupErr = new Error("Duplicate key");
      dupErr.isDuplicateKey = true;
      throw dupErr;
    }
    throw err;
  }
};

const deleteById = (id) => db(TABLE).where("id", id).del();

const findExpired = () =>
  db(TABLE).where("expires_at", "<", Date.now()).select("id", "storage_name");

const deleteByIds = (ids) => db(TABLE).whereIn("id", ids).del();

const findAll = (page, perPage) =>
  db(TABLE)
    .orderBy("created_at", "desc")
    .limit(perPage)
    .offset((page - 1) * perPage);

const countAll = async () => {
  const [{ count }] = await db(TABLE).count("id as count");
  return Number(count);
};

const allStorageNames = async () => {
  const rows = await db(TABLE).select("storage_name");
  return new Set(rows.map((row) => row.storage_name));
};

module.exports = {
  findByKey,
  findById,
  insert,
  deleteById,
  findExpired,
  deleteByIds,
  findAll,
  countAll,
  allStorageNames,
};
