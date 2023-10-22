'use strict';

const Database = use('Database');

class PreferenceFormController {
  // Display the page that academics' preferences have been successfully updated
  async displaySuccessPage({ view }) {
    return view.render('teachingFormSuccess');
  }

  // Display the page that it failed to update academics' preferences
  async displayFailurePage({ view }) {
    return view.render('teachingFormFailure');
  }

  // Update academics' preferences
  async updatePreferences({ request, response }) {
    // Check if a certain academic exists in the database
    let academics = await Database.from('academics');
    let doesAcademicExist = false;
    for (const academic of academics) {
      if (academic.id == request.body.id) {
        doesAcademicExist = true;
        break;
      }
    }

    if (doesAcademicExist) {
      // Update a certain record if it exists in the database,
      // otherwise insert a new record to the database
      const currentDate = new Date();
      const doesRecordExist = await Database.from('preferences')
        .where('id', request.body.id)
        .where('code', request.body.unitCode)
        .where('preferredSemester', request.body.preferredSemester);
      if (doesRecordExist.length == 1) {
        // Check if an academic entered the value in "Years of Prior Work" in the form
        let yearsOfPriorWork = doesRecordExist.yearsOfPriorWork;
        if (!yearsOfPriorWork) {
          yearsOfPriorWork = 0;
        }
        await Database.from('preferences')
          .where('id', request.body.id)
          .where('code', request.body.unitCode)
          .where('preferredSemester', request.body.preferredSemester)
          .update({
            preferredSemester: request.body.preferredSemester,
            desireToTeach: request.body.willingness,
            abilityToTeach: request.body.experience,
            yearsOfPriorWork: yearsOfPriorWork,
            updated_at: currentDate,
          });
      } else {
        // Check if an academic entered the value in "Years of Prior Work" in the form
        let yearsOfPriorWork = request.body.yearsOfPriorWork;
        if (!yearsOfPriorWork) {
          yearsOfPriorWork = 0;
        }
        await Database.table('preferences').insert({
          id: request.body.id,
          code: request.body.unitCode,
          preferredSemester: request.body.preferredSemester,
          desireToTeach: request.body.willingness,
          abilityToTeach: request.body.experience,
          yearsOfPriorWork: yearsOfPriorWork,
          created_at: currentDate,
          updated_at: currentDate,
        });
      }

      return response.route('/preference_form/success', true);
    } else {
      return response.route('/preference_form/failure', true);
    }
  }

  // Display the preference form
  async displayForm({ view }) {
    // Make an array to store only unit codes
    let units = await Database.from('units');
    let unitsArray = [];
    for (const unit of units) {
      unitsArray.push(unit.code);
    }

    // An array storing values used to select for academics' willingness and experiences
    const teachingValuesArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return view.render('teachingForm', {
      unitsArray: unitsArray,
      teachingValuesArray: teachingValuesArray,
    });
  }
}

module.exports = PreferenceFormController;
