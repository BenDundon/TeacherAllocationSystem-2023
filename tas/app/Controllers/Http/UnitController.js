'use strict';
const Exception = use('App/Exceptions/Handler');
const Logger = use('Logger');
const Unit = use('App/Models/Unit');
const Offering = use('App/Models/Offering');
const Preference = use('App/Models/Preference');
const Database = use('Database');

class UnitController {
  async render({ request, view }) {
    try {
      // Obtain input from searchbar, sorting and some filtering options -> estimatedEnrolments
      var searchbar = request.input('searchbar');
      var sortOption = request.input('sortOption');
      var minEnrols = request.input('minEnrols');
      var maxEnrols = request.input('maxEnrols');
      var minShare = request.input('minShare');
      var maxShare = request.input('maxShare');

      // Default sorting + filtering options
      if (!searchbar) {
        searchbar = '';
      }
      if (!sortOption) {
        sortOption = 'code';
      }

      // Obtain from database
      var units = await Database.from('units')
        .where('code', 'ilike', '%' + searchbar + '%')
        .orWhere('name', 'ilike', '%' + searchbar + '%')
        .orderBy(sortOption);
      var offerings = await Database.from('offerings');

      // Obtain filtering option -> subjectAreaGroup
      var subjectAreaGroups = [];
      units.filter((unit) => {
        if (!subjectAreaGroups.includes(unit.subjectAreaGroup)) {
          subjectAreaGroups.push(unit.subjectAreaGroup);
        }
      });
      subjectAreaGroups.sort();

      var subjectAreaGroupsInput = [];
      for (const group of subjectAreaGroups) {
        subjectAreaGroupsInput.push(request.input(group));
      }

      // Filtering subjectAreaGroup
      for (let i = 0; i < subjectAreaGroups.length; i++) {
        const group = subjectAreaGroups[i];
        if (
          !subjectAreaGroupsInput.every((el) => el == undefined) &&
          !subjectAreaGroupsInput[i]
        ) {
          units = units.filter((unit) => unit.subjectAreaGroup != group);
        }
      }

      // Obtain filtering option -> semester
      var semesters = [];
      offerings.filter((offering) => {
        if (!semesters.includes(offering.semester)) {
          semesters.push(offering.semester);
        }
      });
      semesters.sort();

      var semestersInput = [];
      for (const sem of semesters) {
        semestersInput.push(request.input(sem));
      }

      // Filtering semester
      for (let i = 0; i < semesters.length; i++) {
        const sem = semesters[i];
        if (
          !semestersInput.every((el) => el == undefined) &&
          !semestersInput[i]
        ) {
          offerings = offerings.filter((offering) => offering.semester != sem);
        }
      }

      // Filtering estimatedEnrolments
      if (minEnrols) {
        offerings = offerings.filter(
          (offering) => offering.estimatedEnrolments >= minEnrols,
        );
      }
      if (maxEnrols) {
        offerings = offerings.filter(
          (offering) => offering.estimatedEnrolments <= maxEnrols,
        );
      }

      // Filtering schoolShare
      if (minShare) {
        offerings = offerings.filter(
          (offering) => offering.schoolShare >= minShare,
        );
      }
      if (maxShare) {
        offerings = offerings.filter(
          (offering) => offering.schoolShare <= maxShare,
        );
      }

      // Filtering out the same units in 'offerings' array as 'units' array
      const reducedUnitCodes = offerings.map((offering) => offering.code);
      units = units.filter((unit) => reducedUnitCodes.includes(unit.code));

      //helper function
      // Accepts the array and key
      const groupBy = (array, key) => {
        // Return the end result
        return array.reduce((result, currentValue) => {
          // If an array already present for key, push it to the array. Else create an array and push the object
          (result[currentValue[key]] = result[currentValue[key]] || []).push(
            currentValue,
          );
          // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
          return result;
        }, {}); // empty object is the initial value for result object
      };

      const groupedUnits = groupBy(offerings, 'code');

      return view.render('units', {
        units: units,
        groupedUnits: groupedUnits,
        subjectAreaGroups: subjectAreaGroups,
        semesters: semesters,
      });
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }

  async addunit({ request, response }) {
    try {
      const newUnit = new Unit();
      newUnit.code = request.input('code');
      newUnit.name = request.input('name');
      newUnit.subjectAreaGroup = request.input('subjectAreaGroup');
      await newUnit.save();
      return response.route('/units', true);
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }
  async addoffering({ request, response }) {
    try {
      const newOffering = new Offering();
      const offeringLength = await Database.from('offerings').count();
      console.log(offeringLength[0].count);

      //fills id values of offerings if any have been deleted
      let thisOfferingID = 0;
      for (let i = 1; i < offeringLength[0].count; i++) {
        const thisCheck = await Database.from('offerings').where('id', i);
        if (!thisCheck.length != 0) {
          thisOfferingID = i;
          break;
        }
      }

      newOffering.id = thisOfferingID;
      newOffering.code = request.input('code');
      newOffering.semester =
        request.input('year') + '/' + request.input('semester');
      newOffering.estimatedEnrolments = request.input('estimatedEnrolments');
      newOffering.schoolShare = request.input('schoolShare');
      await newOffering.save();

      return response.route('/units', true);
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }

  async updateoffering({ response, request }) {
    try {
      await Offering.query()
        .where({ id: request.input('id') })
        .update({
          semester: request.input('semester'),
          estimatedEnrolments: request.input('estimatedEnrolments'),
          schoolShare: request.input('schoolShare'),
        });

      return response.route('/units', true);
    } catch (error) {
      Logger.error('Update Offering', error);
      throw new Exception();
    }
  }
  async deleteoffering({ response, request }) {
    try {
      await Database.from('allocations')
        .where('id', request.input('id'))
        .delete();
      await Database.from('offerings')
        .where('id', request.input('id'))
        .delete();
    } catch (error) {
      Logger.error('Delete Offering', error);
      throw new Exception();
    }
    return response.route('/units', true);
  }

  async updateunit({ response, request }) {
    try {
      //todo: need to do updates simultaneously
      await Offering.query()
        .where({ code: request.input('originalCode') })
        .update({
          code: request.input('code'),
        });
      await Preference.query()
        .where({ code: request.input('originalCode') })
        .update({
          code: request.input('code'),
        });
      await Unit.query()
        .where({ code: request.input('originalCode') })
        .update({
          code: request.input('code'),
          name: request.input('name'),
          subjectAreaGroup: request.input('subjectAreaGroup'),
        });

      return response.route('/units', true);
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }
  async deleteunit({ response, request }) {
    try {
      const offeringEntries = await Database.select('offerings.id')
        .from('offerings')
        .where('code', request.input('code'));
      await Database.from('allocations')
        .where('id', offeringEntries[0].id)
        .delete();
      await Database.from('offerings')
        .where('code', request.input('code'))
        .delete();
      await Database.from('preferences')
        .where('code', request.input('code'))
        .delete();
      //todo: Need to decrement offerings and allocations for each offering
      //await Database.from('offerings').where("id",">",offeringEntries[0].id).decrement('id',offeringEntries.length);
      await Database.from('units')
        .where('code', request.input('code'))
        .delete();
    } catch (error) {
      Logger.error('Delete Unit', error);
      throw new Exception();
    }
    return response.route('/units', true);
  }
}
module.exports = UnitController;
