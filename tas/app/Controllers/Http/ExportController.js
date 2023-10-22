'use strict';
const Exception = use('App/Exceptions/Handler');
const Logger = use('Logger');

const Excel = require('exceljs');
const Helpers = use('Helpers');
const Academic = use('App/Models/Academic');
const Unit = use('App/Models/Unit');
const Allocation = use('App/Models/Allocation');
const Offering = use('App/Models/Offering');
const Preference = use('App/Models/Preference');

const Database = use('Database');

class ExportController {
  async ExportWorksheet() {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile('public/template.xlsx');
    const AcademicSheet = workbook.worksheets[0];
    const UnitSheet = workbook.worksheets[1];
    const AllocationSheet = workbook.worksheets[2];
    const OfferingSheet = workbook.worksheets[3];
    const PreferenceSheet = workbook.worksheets[4];

    const academicsDB = await Academic.all();
    const academics = academicsDB.toJSON();

    const unitsDB = await Unit.all();
    const units = unitsDB.toJSON();

    const allocationsDB = await Allocation.all();
    const allocations = allocationsDB.toJSON();

    const offeringsDB = await Offering.all();
    const offerings = offeringsDB.toJSON();

    const preferencesDB = await Preference.all();
    const preferences = preferencesDB.toJSON();

    //sheet 1 - academics
    for (let i = 0; i < academics.length; i++) {
      let j = i + 2;
      AcademicSheet.getCell('A' + j.toString()).value = academics[i].id;
      AcademicSheet.getCell('B' + j.toString()).value = academics[i].name;
      AcademicSheet.getCell('C' + j.toString()).value = academics[i].category;
      AcademicSheet.getCell('D' + j.toString()).value =
        academics[i].teachingFraction;
    }
    //sheet 2 - units
    for (let i = 0; i < units.length; i++) {
      let j = i + 2;
      UnitSheet.getCell('A' + j.toString()).value = units[i].code;
      UnitSheet.getCell('B' + j.toString()).value = units[i].name;
      UnitSheet.getCell('C' + j.toString()).value = units[i].subjectAreaGroup;
    }
    //sheet 3 - Allocations
    for (let i = 0; i < allocations.length; i++) {
      let j = i + 2;
      AllocationSheet.getCell('A' + j.toString()).value =
        allocations[i].academicId;
      AllocationSheet.getCell('B' + j.toString()).value = allocations[i].id;
      AllocationSheet.getCell('C' + j.toString()).value =
        allocations[i].fractionAllocated;
      AllocationSheet.getCell('D' + j.toString()).value =
        allocations[i].unitCoordinator;
    }

    //sheet 4 - Offerings
    for (let i = 0; i < offerings.length; i++) {
      let j = i + 2;
      OfferingSheet.getCell('A' + j.toString()).value = offerings[i].id;
      OfferingSheet.getCell('B' + j.toString()).value = offerings[i].code;
      OfferingSheet.getCell('C' + j.toString()).value = offerings[i].semester;
      OfferingSheet.getCell('D' + j.toString()).value =
        offerings[i].estimatedEnrolments;
      OfferingSheet.getCell('E' + j.toString()).value =
        offerings[i].schoolShare;
    }
    //sheet 5 - Preferences
    for (let i = 0; i < preferences.length; i++) {
      let j = i + 2;
      PreferenceSheet.getCell('A' + j.toString()).value = preferences[i].id;
      PreferenceSheet.getCell('B' + j.toString()).value = preferences[i].code;
      PreferenceSheet.getCell('C' + j.toString()).value =
        preferences[i].desireToTeach;
      PreferenceSheet.getCell('D' + j.toString()).value =
        preferences[i].abilityToTeach;
    }

    await workbook.xlsx.writeFile('public/template2.xlsx');
  }

  async render({ request, response }) {
    console.log('start render');
    try {
      console.log('start export');
      await this.ExportWorksheet();
      console.log('written to excel');
      return response.download('public/template2.xlsx');
      console.log('download start');
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }
}

module.exports = ExportController;
