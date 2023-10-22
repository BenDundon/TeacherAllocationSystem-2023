'use strict';

const Exception = use('App/Exceptions/Handler');
const Logger = use('Logger');
const Academic = use('App/Models/Academic');
const Preference = use('App/Models/Preference');
const Database = use('Database');

class AcademicController {
  async addacademic({ request, response }) {
    try {
      const newAcademic = new Academic();
      newAcademic.id = request.input('id');
      newAcademic.name = request.input('name');
      newAcademic.category = request.input('category');
      newAcademic.teachingFraction = request.input('teachingFraction');

      await newAcademic.save();
      return response.route('/academics', true);
    } catch (error) {
      Logger.error('Add Academics' + error);
      throw new Exception();
    }
  }

  async deleteacademic({ response, request }) {
    try {
      await Database.from('allocations')
        .where('academicId', request.input('id'))
        .delete();
      await Database.from('preferences')
        .where('id', request.input('id'))
        .delete();
      await Database.from('academics')
        .where('id', request.input('id'))
        .delete();
    } catch (error) {
      Logger.error('Delete Academics', error);
      throw new Exception();
    }
    return response.route('/academics', true);
  }

  async updateacademic({ response, request }) {
    try {
      await Database.from('academics')
        .where('id', request.input('id'))
        .update({
          id: request.input('newId'),
          name: request.input('name'),
          category: request.input('category'),
          teachingFraction: request.input('teachingFraction'),
        });
      return response.route('/academics', true);
    } catch (error) {
      Logger.error('Update Academics', error);
      throw new Exception();
    }
  }

  // Add academics' preference
  async addPreference({ request, response }) {
    try {
      // Update a certain record if it exists in the database,
      // otherwise insert a new record to the database
      const currentDate = new Date();
      const doesRecordExist = await Database.from('preferences')
        .where('id', request.body.id)
        .where('code', request.body.code)
        .where('preferredSemester', request.body.preferredSemester);
      if (doesRecordExist.length == 1) {
        // Check if an academic entered the value in "Years of Prior Work" in the form
        let yearsOfPriorWork = doesRecordExist.yearsOfPriorWork;
        if (!yearsOfPriorWork) {
          yearsOfPriorWork = 0;
        }
        await Database.from('preferences')
          .where('id', request.body.id)
          .where('code', request.body.code)
          .where('preferredSemester', request.body.preferredSemester)
          .update({
            preferredSemester: request.body.preferredSemester,
            desireToTeach: request.body.desireToTeach,
            abilityToTeach: request.body.abilityToTeach,
            yearsOfPriorWork: yearsOfPriorWork,
            updated_at: currentDate,
          });
      } else {
        // Check if a user entered the value in "Years Of Prior Work" in the form
        let yearsOfPriorWork = request.body.yearsOfPriorWork;
        if (!yearsOfPriorWork) {
          yearsOfPriorWork = 0;
        }
        await Database.table('preferences').insert({
          id: request.body.id,
          code: request.body.code,
          preferredSemester: request.body.preferredSemester,
          desireToTeach: request.body.desireToTeach,
          abilityToTeach: request.body.abilityToTeach,
          yearsOfPriorWork: yearsOfPriorWork,
          created_at: currentDate,
          updated_at: currentDate,
        });
      }
      return response.route('/academics', true);
    } catch (error) {
      Logger.error('Add Preferences' + error);
      throw new Exception();
    }
  }

  // Update academics' preference
  async updatePreference({ request, response }) {
    try {
      await Database.from('preferences')
        .where('code', request.body.originalCode)
        .where('id', request.body.id)
        .where('preferredSemester', request.body.originalPreferredSemester)
        .update({
          code: request.body.code,
          preferredSemester: request.body.preferredSemester,
          desireToTeach: request.body.desireToTeach,
          abilityToTeach: request.body.abilityToTeach,
          yearsOfPriorWork: yearsOfPriorWork,
        });
      return response.route('/academics', true);
    } catch (error) {
      Logger.error('Update Preferences', error);
      throw new Exception();
    }
  }

  // Delete academics' preference
  async deletePreference({ response, request }) {
    try {
      await Database.from('preferences')
        .where('code', request.body.originalCode)
        .where('id', request.body.id)
        .where('preferredSemester', request.body.originalPreferredSemester)
        .delete();
      return response.route('/academics', true);
    } catch (error) {
      Logger.error('Delete Preferences', error);
      throw new Exception();
    }
  }

  async render({ request, view }) {
    try {
      // Obtain the searchbar input + sorting/filtering options
      var searchbar = request.input('searchbar');
      var sortOption = request.input('sortOption');
      var minTeachFrac = request.input('minTeachFrac');
      var maxTeachFrac = request.input('maxTeachFrac');
      var ongoing = request.input('Ongoing');
      var sessional = request.input('Sessional');

      // Default sorting + filtering options
      if (!searchbar) {
        searchbar = '';
      }
      if (!sortOption) {
        sortOption = 'name';
      }

      // Obtain from database + sorting
      var academics = await Database.from('academics')
        .where('name', 'ilike', '%' + searchbar + '%')
        .orWhere('id', 'ilike', '%' + searchbar + '%')
        .orderBy(sortOption);
      const preferences = await Database.from('preferences');
      const units = await Database.from('units');

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

      const groupedPreferences = groupBy(preferences, 'id');

      // Filtering category
      if (ongoing && sessional) {
      } else if (ongoing) {
        academics = academics.filter(
          (academic) => academic.category == ongoing,
        );
      } else if (sessional) {
        academics = academics.filter(
          (academic) => academic.category == sessional,
        );
      }

      // Filtering teaching fraction
      if (minTeachFrac) {
        academics = academics.filter(
          (academic) => academic.teachingFraction >= minTeachFrac,
        );
      }
      if (maxTeachFrac) {
        academics = academics.filter(
          (academic) => academic.teachingFraction <= maxTeachFrac,
        );
      }

      return view.render('academics', {
        academics: academics,
        units: units,
        groupedPreferences: groupedPreferences,
      });
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }
}
module.exports = AcademicController;
