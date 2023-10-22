'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Allocation extends Model {
  academics() {
    return this.belongsTo('App/Models/Academic');
  }

  unitOfferings() {
    return this.belongsTo('App/Models/UnitOffering');
  }
}

module.exports = Allocation;
