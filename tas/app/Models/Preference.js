'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Preference extends Model {
  academic() {
    return this.belongsTo('App/Model/Academic');
  }

  unit() {
    return this.belongsTo('App/Models/Unit');
  }
}

module.exports = Preference;
