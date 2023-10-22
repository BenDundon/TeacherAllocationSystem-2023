'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class OfferingsSchema extends Schema {
  up() {
    this.create('offerings', (table) => {
      table.integer('id').unique();
      table.string('code');
      table.string('semester');
      table.integer('estimatedEnrolments');
      table.float('schoolShare');
      table.timestamps();
      //todo:these combination unique constraints aren't implemented correctly
      //table.unique(['code', 'semester'])
    });
  }

  down() {
    this.drop('offerings');
  }
}

module.exports = OfferingsSchema;
