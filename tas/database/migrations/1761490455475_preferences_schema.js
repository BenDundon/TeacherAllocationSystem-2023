'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class PreferencesSchema extends Schema {
  up() {
    this.create('preferences', (table) => {
      table.string('id').references('id').inTable("academics")
      table.string('code').references('code').inTable("units")
      table.string('preferredSemester')
      table.integer('desireToTeach')
      table.integer('abilityToTeach')
      table.integer('yearsOfPriorWork')
      table.float('score').defaultTo(0);
      table.timestamps()
      table.unique(['id', 'code', 'preferredSemester']);
    });
  }

  down() {
    this.drop('preferences');
  }
}

module.exports = PreferencesSchema;
