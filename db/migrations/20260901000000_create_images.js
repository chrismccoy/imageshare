/**
 * Initial migration. Creates the images table.
 */

exports.up = async (knex) => {
  await knex.schema.createTable("images", (t) => {
    t.increments("id").primary();
    t.string("key").notNullable().unique();
    t.string("storage_name").notNullable();
    t.string("mime").notNullable();
    t.integer("size_bytes").notNullable();
    t.integer("width").notNullable();
    t.integer("height").notNullable();
    t.bigInteger("expires_at").notNullable();
    t.timestamps(true, true);

    t.index("expires_at");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("images");
};
