/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('UtilisateurClient', function(table) {
      table.increments('IdClient').primary();
      table.string('Nom', 25).notNullable();
      table.string('Prenom', 25).notNullable();
      table.string('Courriel', 25).notNullable().unique();
      table.string('MotDePasse', 25).notNullable();
      table.string('UniqueToken', 100).notNullable().unique();
      table.string('type', 25).notNullable();
    });
  };
  
  /**
  * @param { import("knex").Knex } knex
  * @returns { Promise<void> }
  */
  exports.down = function(knex) {
    return knex.schema.dropTable('UtilisateurClient');
  };