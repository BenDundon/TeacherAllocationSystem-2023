'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class UnitSchema extends Schema {
  up() {
    this.create('units', (table) => {
      table.string('id');
      table.string('code').unique().primary();
      table.string('name');
      table.string('subjectAreaGroup');
      table.timestamps();
    });
  }

  down() {
    this.drop('units');
  }
}

module.exports = UnitSchema;
