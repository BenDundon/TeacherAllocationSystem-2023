'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Offerings extends Model {
  Unit() {
    return this.belongsTo('App/Model/Unit');
  }
}

module.exports = Offerings;
