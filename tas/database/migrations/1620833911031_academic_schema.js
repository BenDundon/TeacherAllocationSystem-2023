'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class AcademicSchema extends Schema {
  up() {
    this.create('academics', (table) => {
      table.string('id').unique().primary();
      table.string('name').unique();
      table.string('category');
      table.float('teachingFraction');
      table.timestamps();
    });
  }

  down() {
    this.drop('academics');
  }
}

module.exports = AcademicSchema;
