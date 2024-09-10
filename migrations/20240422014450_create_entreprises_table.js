exports.up = function(knex) {
    return knex.schema.createTable('UtilisateurEntreprise', function(table) {
      table.increments('IdEntreprise').primary();
      table.string('NomEntreprise').notNullable();
      table.string('Courriel').notNullable().unique();
      table.string('MotDePasse').notNullable();
      table.string('UniqueToken').notNullable().unique();
      table.string('type').notNullable();
      table.string('Adresse');
      table.string('CodePostal');
      table.string('NumeroTelephone');
      table.text('ServiceOffert');
      table.string('Lundi');
      table.string('Mardi');
      table.string('Mercredi');
      table.string('Jeudi');
      table.string('Vendredi');
      table.string('Samedi');
      table.string('Dimanche');
      table.string('Échelledeprix');
      table.string('SiteWeb');
      table.text('Description');
      table.text('Portfolio');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('Entreprises');
  };
  
