'use strict';

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class AllocationSchema extends Schema {
  up() {
    this.create('allocations', (table) => {
      table.string('academicId').references('id').inTable('academics');
      table.integer('id').references('id').inTable('offerings');
      table.float('fractionAllocated');
      table.boolean('unitCoordinator');
      table.timestamps();
      //todo:these combination unique constraints aren't implemented correctly
      //table.unique(['academicId', 'id'])
    });
  }

  down() {
    this.drop('allocations');
  }
}

module.exports = AllocationSchema;
