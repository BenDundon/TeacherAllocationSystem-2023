'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Unit extends Model {
  unitOfferings() {
    return this.hasMany('App/Model/UnitOffering');
  }
}

module.exports = Unit;
