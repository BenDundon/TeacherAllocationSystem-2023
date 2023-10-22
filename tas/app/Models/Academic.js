'use strict';

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class Academic extends Model {
  allocations() {
    return this.hasMany('App/Models/Allocation');
  }

  preferences() {
    return this.hasMany('App/Models/Preference');
  }
}

module.exports = Academic;
