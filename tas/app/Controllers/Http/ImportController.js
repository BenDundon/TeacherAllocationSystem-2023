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

class AcademicImport {
  constructor(academicId, name, category, teachingFraction) {
    this.id = academicId;
    this.name = name;
    this.category = category;
    this.teachingFraction = teachingFraction;
  }
  async save() {
    const ac = new Academic();
    ac.id = this.id;
    ac.name = this.name;
    ac.category = this.category;
    ac.teachingFraction = this.teachingFraction;
    await ac.save();
    console.log('academic entered');
  }
}

class UnitImport {
  constructor(code, name, subjectAreaGroup) {
    this.code = code;
    this.name = name;
    this.subjectAreaGroup = subjectAreaGroup;
  }
  async save() {
    const un = new Unit();
    un.code = this.code;
    un.name = this.name;
    un.subjectAreaGroup = this.subjectAreaGroup;
    await un.save();
  }
}

class AllocationImport {
  constructor(academicId, offeringId, fractionAllocated, unitCoordinator) {
    this.academicId = academicId;
    this.id = offeringId;
    this.fractionAllocated = fractionAllocated;
    this.unitCoordinator = unitCoordinator;
  }
  async save() {
    const al = new Allocation();
    al.academicId = this.academicId;
    al.id = this.id;
    al.fractionAllocated = this.fractionAllocated;
    al.unitCoordinator = this.unitCoordinator;
    await al.save();
  }
}

class OfferingImport {
  constructor(offeringId, code, semester, estimatedEnrolments, schoolShare) {
    this.id = offeringId;
    this.code = code;
    this.semester = semester;
    this.estimatedEnrolments = estimatedEnrolments;
    this.schoolShare = schoolShare;
  }
  async save() {
    const uno = new Offering();
    uno.id = this.id;
    uno.code = this.code;
    uno.semester = this.semester;
    uno.estimatedEnrolments = this.estimatedEnrolments;
    uno.schoolShare = this.schoolShare;
    await uno.save();
  }
}

class PreferenceImport {
  constructor(
    academicId,
    code,
    preferredSemester,
    desireToTeach,
    abilityToTeach,
    yearsOfPriorWork,
  ) {
    this.id = academicId;
    this.code = code;
    this.preferredSemester = preferredSemester;
    this.desireToTeach = desireToTeach;
    this.abilityToTeach = abilityToTeach;
    this.yearsOfPriorWork = yearsOfPriorWork;
  }
  async save() {
    const pr = new Preference();
    pr.id = this.id;
    pr.code = this.code;
    pr.preferredSemester = this.preferredSemester;
    pr.desireToTeach = this.desireToTeach;
    pr.abilityToTeach = this.abilityToTeach;
    pr.yearsOfPriorWork = this.yearsOfPriorWork;
    await pr.save();
  }
}

class ImportController {
  async uploadFile({ request, response, view }) {
    console.log('file upload');
    try {
      const upload = request.file('Allocation', {
        size: '10mb',
      });
      await upload.move(Helpers.tmpPath('uploads'), {
        name: `uploadedData.xlsm`,
        overwrite: true,
      });

      if (!upload.moved()) {
        return upload.error();
      }

      console.log('start read');
      await this.ReadWorksheet();
      console.log('read worksheet');
      //not sure about this response route (redirect)
      response.route('/allocations');
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }

  async ReadWorksheet() {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile('tmp/uploads/uploadedData.xlsm');

    //Must be in this order to delete due to foreign key constraints
    await Database.table('allocations').delete();
    await Database.table('offerings').delete();
    await Database.table('preferences').delete();
    await Database.table('units').delete();
    await Database.table('academics').delete();

    const AcademicSheet = workbook.worksheets[0];
    const UnitSheet = workbook.worksheets[1];
    const AllocationSheet = workbook.worksheets[2];
    const OfferingSheet = workbook.worksheets[3];
    const PreferenceSheet = workbook.worksheets[4];

    let academicList = [];
    let unitList = [];
    let allocationList = [];
    let offeringList = [];
    let preferenceList = [];

    //sheet 1 - academics
    let i = 0;
    while (1) {
      const row = AcademicSheet.getRow(i + 2);
      if (row.getCell('A') == null || row.getCell('A') == '') {
        break;
      } else {
        const academicId = row.getCell('A').value;
        const name = row.getCell('B').value;
        const category = row.getCell('C').value;
        const teachingFraction = row.getCell('D').value;
        const newAcademic = new AcademicImport(
          academicId,
          name,
          category,
          teachingFraction,
        );
        academicList.push(newAcademic);
        i++;
      }
    }

    //sheet 2 - units
    i = 0;
    while (1) {
      const row = UnitSheet.getRow(i + 2);
      if (row.getCell('A') == null || row.getCell('A') == '') {
        break;
      } else {
        const code = row.getCell('A').value;
        const name = row.getCell('B').value;
        const subjectAreaGroup = row.getCell('C').value;
        const newUnit = new UnitImport(code, name, subjectAreaGroup);
        unitList.push(newUnit);
        i++;
      }
    }

    //sheet 3 - allocations
    i = 0;
    while (1) {
      const row = AllocationSheet.getRow(i + 2);
      if (row.getCell('A') == null || row.getCell('A') == '') {
        break;
      } else {
        const academicId = row.getCell('A').value;
        const offeringId = row.getCell('B').value;
        const fractionAllocated = row.getCell('C').value;
        const unitCoordinator = row.getCell('D').value;
        const newAllocation = new AllocationImport(
          academicId,
          offeringId,
          fractionAllocated,
          unitCoordinator,
        );
        allocationList.push(newAllocation);
        i++;
      }
    }

    //sheet 4 - unit Offerings
    i = 0;
    while (1) {
      const row = OfferingSheet.getRow(i + 2);
      if (row.getCell('A') == null || row.getCell('A') == '') {
        break;
      } else {
        const offeringId = row.getCell('A').value;
        const code = row.getCell('B').value;
        const semester = row.getCell('C').value;
        const estimatedEnrolments = row.getCell('D').value;
        const schoolShare = row.getCell('E').value;
        const newOffering = new OfferingImport(
          offeringId,
          code,
          semester,
          estimatedEnrolments,
          schoolShare,
        );
        offeringList.push(newOffering);
        i++;
      }
    }

    //sheet 5 - preferences
    i = 0;
    while (1) {
      const row = PreferenceSheet.getRow(i + 2);
      if (row.getCell('A') == null || row.getCell('A') == '') {
        break;
      } else {
        const academicId = row.getCell('A').value;
        const code = row.getCell('B').value;
        const preferredSemester = '2022/1'; // Default value
        const desireToTeach = row.getCell('C').value;
        const abilityToTeach = row.getCell('D').value;
        const yearsOfPriorWork = 0; // Default value
        const newPreference = new PreferenceImport(
          academicId,
          code,
          preferredSemester,
          desireToTeach,
          abilityToTeach,
          yearsOfPriorWork,
        );
        preferenceList.push(newPreference);
        i++;
      }
    }

    //must be in this order to ensure foreign keys?
    academicList.forEach((academicImport) => {
      academicImport.save();
    });
    unitList.forEach((unitImport) => {
      unitImport.save();
    });

    offeringList.forEach((offeringImport) => {
      offeringImport.save();
    });

    allocationList.forEach((allocationImport) => {
      allocationImport.save();
    });
    preferenceList.forEach((preferenceImport) => {
      preferenceImport.save();
    });

    return;
  }
}
module.exports = ImportController;
