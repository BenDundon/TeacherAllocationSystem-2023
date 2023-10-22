'use strict';
const Exception = use('App/Exceptions/Handler');
const Logger = use('Logger');
const Database = use('Database');

class SpreadsheetViewController {
  // Update the current table after editing cells in a table
  async updateTable({ request, response }) {
    try {
      // Store keys of the object of "request.body" except "tableName" and "_csrf"
      let object = request.body;
      let keys = [];
      for (let each in object) {
        if (each != 'tableName' && each != '_csrf') {
          keys.push(each);
        }
      }

      // Update all rows in a certain table
      switch (request.body.tableName) {
        case 'Global':
          const doesRecordExist = await Database.from('allocations')
            .where('academicId', object.academicId)
            .where('id', object.unitOfferingId);

          // Update a certain record if it exists in the database,
          // otherwise insert a new record to the database
          if (doesRecordExist.length == 1) {
            await Database.from('allocations')
              .where('academicId', object.academicId)
              .where('id', object.unitOfferingId)
              .update({
                fractionAllocated: object.fractionAllocated,
              });
          } else {
            // Set false for the unit coordinator column by default
            await Database.table('allocations').insert({
              academicId: object.academicId,
              id: object.unitOfferingId,
              fractionAllocated: object.fractionAllocated,
              unitCoordinator: false,
            });
          }
          break;
        case 'Academics':
          for (let i = 0; i < object[keys[0]].length; i++) {
            await Database.from('academics')
              .where('id', object[keys[0]][i])
              .update({
                name: object[keys[1]][i],
                category: object[keys[2]][i],
                teachingFraction: object[keys[3]][i],
              });
          }
          break;
        case 'Units':
          for (let i = 0; i < object[keys[0]].length; i++) {
            await Database.from('units')
              .where('code', object[keys[0]][i])
              .update({
                name: object[keys[1]][i],
                subjectAreaGroup: object[keys[2]][i],
              });
          }
          break;
        case 'Allocations':
          for (let i = 0; i < object[keys[0]].length; i++) {
            await Database.from('allocations')
              .where('academicId', object[keys[0]][i])
              .where('id', object[keys[1]][i])
              .update({
                fractionAllocated: object[keys[2]][i],
                unitCoordinator: object[keys[3]][i],
              });
          }
          break;
        case 'UnitOfferings':
          for (let i = 0; i < object[keys[0]].length; i++) {
            await Database.from('offerings')
              .where('id', object[keys[0]][i])
              .where('code', object[keys[1]][i])
              .where('semester', object[keys[2]][i])
              .update({
                estimatedEnrolments: object[keys[3]][i],
                schoolShare: object[keys[4]][i],
              });
          }
          break;
        case 'Preferences':
          for (let i = 0; i < object[keys[0]].length; i++) {
            await Database.from('preferences')
              .where('id', object[keys[0]][i])
              .where('code', object[keys[1]][i])
              .where('preferredSemester', object[keys[2]][i])
              .update({
                desireToTeach: object[keys[3]][i],
                abilityToTeach: object[keys[4]][i],
                yearsOfPriorWork: object[keys[5]][i],
              });
          }
          break;
      }

      return response.route('/spreadsheetView', true);
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }

  async render({ view, request }) {
    try {
      let academics = await Database.from('academics');
      let units = await Database.from('units');
      let allocations = await Database.from('allocations');
      let offerings = await Database.from('offerings');
      let preferences = await Database.from('preferences');
      let global_spread = await Database.from('academics')
        .leftJoin('allocations', 'academics.id', '=', 'allocations.academicId')
        .leftJoin('offerings', 'allocations.id', '=', 'offerings.id')
        .select('academics.id AS academicId')
        .select('academics.name AS name')
        .select('offerings.id AS unitOfferingId')
        .select('offerings.code AS unitCode')
        .select('offerings.semester AS semester')
        .select('allocations.fractionAllocated AS fractionAllocated');

      // Obtain a URL parameter for sorting a table
      const sortOption = request.input('sortOption');

      // Store the values of a selected tab and a name of a table to display at first
      let selectedTab = 'global-tab';
      let selectedTableName = 'Global';
      
      // Sort a table in ascending order based on a non-numerical column
      const sortAscOrder1 = (table, columnName) => {
        let sortedColumnArray = [];
        let sortedTable = [];

        // Sort an array including only elements of a certain column of a table in ascending order
        table.map((each) => sortedColumnArray.push(each[columnName]));
        sortedColumnArray.sort((a, b) => {
          a.localeCompare(b, undefined, { sensitivity: 'base' });
        });

        // Sort an original table in ascending order according to the order of "sortedColumnArray"
        sortedColumnArray.map((each) => {
          for (let i = 0; i < table.length; i++) {
            if (each == table[i][columnName]) {
              sortedTable.push(table[i]);
              table.splice(i, 1);
              break;
            }
          }
        });

        return sortedTable;
      };

      // Sort a table in descending order based on a non-numerical column
      const sortDescOrder1 = (table, columnName) => {
        let sortedColumnArray = [];
        let sortedTable = [];

        // Sort an array including only elements of a certain column of a table in descending order
        table.map((each) => sortedColumnArray.push(each[columnName]));
        sortedColumnArray
          .sort((a, b) => {
            a.localeCompare(b, undefined, { sensitivity: 'base' });
          })
          .reverse();

        // Sort an original table in descending order according to the order of "sortedColumnArray"
        sortedColumnArray.map((each) => {
          for (let i = 0; i < table.length; i++) {
            if (each == table[i][columnName]) {
              sortedTable.push(table[i]);
              table.splice(i, 1);
              break;
            }
          }
        });

        return sortedTable;
      };

      // Sort a table in ascending order based on a boolean column
      const sortAscOrder2 = (table, columnName) => {
        let sortedColumnArray = [];
        let sortedTable = [];

        // Sort an array including only elements of a certain column of a table in ascending order
        table.map((each) => sortedColumnArray.push(each[columnName]));
        sortedColumnArray.sort();

        // Sort an original table in ascending order according to the order of "sortedColumnArray"
        sortedColumnArray.map((each) => {
          for (let i = 0; i < table.length; i++) {
            if (each == table[i][columnName]) {
              sortedTable.push(table[i]);
              table.splice(i, 1);
              break;
            }
          }
        });

        return sortedTable;
      };

      // Sort a table in descending order based on a boolean column
      const sortDescOrder2 = (table, columnName) => {
        let sortedColumnArray = [];
        let sortedTable = [];

        // Sort an array including only elements of a certain column of a table in descending order
        table.map((each) => sortedColumnArray.push(each[columnName]));
        sortedColumnArray.sort().reverse();

        // Sort an original table in descending order according to the order of "sortedColumnArray"
        sortedColumnArray.map((each) => {
          for (let i = 0; i < table.length; i++) {
            if (each == table[i][columnName]) {
              sortedTable.push(table[i]);
              table.splice(i, 1);
              break;
            }
          }
        });

        return sortedTable;
      };

      // Sort a table in ascending order based on a numerical column
      const sortAscOrder3 = (table, columnName) => {
        let sortedColumnArray = [];
        let sortedTable = [];

        // Sort an array including only elements of a certain column of a table in ascending order
        table.map((each) => sortedColumnArray.push(each[columnName]));
        sortedColumnArray.sort((a, b) => a - b);

        // Sort an original table in ascending order according to the order of "sortedColumnArray"
        sortedColumnArray.map((each) => {
          for (let i = 0; i < table.length; i++) {
            if (each == table[i][columnName]) {
              sortedTable.push(table[i]);
              table.splice(i, 1);
              break;
            }
          }
        });

        return sortedTable;
      };

      // Sort a table in descending order based on a numerical column
      const sortDescOrder3 = (table, columnName) => {
        let sortedColumnArray = [];
        let sortedTable = [];

        // Sort an array including only elements of a certain column of a table in descending order
        table.map((each) => sortedColumnArray.push(each[columnName]));
        sortedColumnArray.sort((a, b) => a - b).reverse();

        // Sort an original table in descending order according to the order of "sortedColumnArray"
        sortedColumnArray.map((each) => {
          for (let i = 0; i < table.length; i++) {
            if (each == table[i][columnName]) {
              sortedTable.push(table[i]);
              table.splice(i, 1);
              break;
            }
          }
        });

        return sortedTable;
      };

      // A certain table will be sorted if "sortOption" exists,
      // otherwise default sorting will be executed
      if (sortOption) {
        // Sort a table according to the value of sortOption
        switch (sortOption) {
          // For Academics Table
          case 'academicsAsc1':
            academics = sortAscOrder1(academics, 'id');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;
          case 'academicsDesc1':
            academics = sortDescOrder1(academics, 'id');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;
          case 'academicsAsc2':
            academics = sortAscOrder1(academics, 'name');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;
          case 'academicsDesc2':
            academics = sortDescOrder1(academics, 'name');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;
          case 'academicsAsc3':
            academics = sortAscOrder1(academics, 'category');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;
          case 'academicsDesc3':
            academics = sortDescOrder1(academics, 'category');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;
          case 'academicsAsc4':
            academics = sortAscOrder3(academics, 'teachingFraction');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;
          case 'academicsDesc4':
            academics = sortDescOrder3(academics, 'teachingFraction');
            selectedTab = 'academics-tab';
            selectedTableName = 'Academics';
            break;

          // For Units Table
          case 'unitsAsc1':
            units = sortAscOrder1(units, 'code');
            selectedTab = 'units-tab';
            selectedTableName = 'Units';
            break;
          case 'unitsDesc1':
            units = sortDescOrder1(units, 'code');
            selectedTab = 'units-tab';
            selectedTableName = 'Units';
            break;
          case 'unitsAsc2':
            units = sortAscOrder1(units, 'name');
            selectedTab = 'units-tab';
            selectedTableName = 'Units';
            break;
          case 'unitsDesc2':
            units = sortDescOrder1(units, 'name');
            selectedTab = 'units-tab';
            selectedTableName = 'Units';
            break;
          case 'unitsAsc3':
            units = sortAscOrder1(units, 'subjectAreaGroup');
            selectedTab = 'units-tab';
            selectedTableName = 'Units';
            break;
          case 'unitsDesc3':
            units = sortDescOrder1(units, 'subjectAreaGroup');
            selectedTab = 'units-tab';
            selectedTableName = 'Units';
            break;

          // For Allocations Table
          case 'allocationsAsc1':
            allocations = sortAscOrder1(allocations, 'academicId');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;
          case 'allocationsDesc1':
            allocations = sortDescOrder1(allocations, 'academicId');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;
          case 'allocationsAsc2':
            allocations = sortAscOrder3(allocations, 'id');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;
          case 'allocationsDesc2':
            allocations = sortDescOrder3(allocations, 'id');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;
          case 'allocationsAsc3':
            allocations = sortAscOrder3(allocations, 'fractionAllocated');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;
          case 'allocationsDesc3':
            allocations = sortDescOrder3(allocations, 'fractionAllocated');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;
          case 'allocationsAsc4':
            allocations = sortAscOrder2(allocations, 'unitCoordinator');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;
          case 'allocationsDesc4':
            allocations = sortDescOrder2(allocations, 'unitCoordinator');
            selectedTab = 'allocations-tab';
            selectedTableName = 'Allocations';
            break;

          // For UnitOfferings Table
          case 'unitOfferingsAsc1':
            offerings = sortAscOrder3(offerings, 'id');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsDesc1':
            offerings = sortDescOrder3(offerings, 'id');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsAsc2':
            offerings = sortAscOrder1(offerings, 'code');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsDesc2':
            offerings = sortDescOrder1(offerings, 'code');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsAsc3':
            offerings = sortAscOrder1(offerings, 'semester');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsDesc3':
            offerings = sortDescOrder1(offerings, 'semester');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsAsc4':
            offerings = sortAscOrder3(offerings, 'estimatedEnrolments');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsDesc4':
            offerings = sortDescOrder3(offerings, 'estimatedEnrolments');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsAsc5':
            offerings = sortAscOrder3(offerings, 'schoolShare');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;
          case 'unitOfferingsDesc5':
            offerings = sortDescOrder3(offerings, 'schoolShare');
            selectedTab = 'unitOfferings-tab';
            selectedTableName = 'UnitOfferings';
            break;

          // For Preferences Table
          case 'preferencesAsc1':
            preferences = sortAscOrder1(preferences, 'id');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesDesc1':
            preferences = sortDescOrder1(preferences, 'id');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesAsc2':
            preferences = sortAscOrder1(preferences, 'code');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesDesc2':
            preferences = sortDescOrder1(preferences, 'code');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesAsc3':
            preferences = sortAscOrder1(preferences, 'preferredSemester');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesDesc3':
            preferences = sortDescOrder1(preferences, 'preferredSemester');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesAsc4':
            preferences = sortAscOrder3(preferences, 'desireToTeach');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesDesc4':
            preferences = sortDescOrder3(preferences, 'desireToTeach');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesAsc5':
            preferences = sortAscOrder3(preferences, 'abilityToTeach');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesDesc5':
            preferences = sortDescOrder3(preferences, 'abilityToTeach');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesAsc6':
            preferences = sortAscOrder3(preferences, 'yearsOfPriorWork');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case 'preferencesDesc6':
            preferences = sortDescOrder3(preferences, 'yearsOfPriorWork');
            selectedTab = 'preferences-tab';
            selectedTableName = 'Preferences';
            break;
          case "preferencesAsc7":
            preferences = sortAscOrder3(preferences, "score");
            selectedTab = "preferences-tab";
            selectedTableName = "Preferences";
            break;
          case "preferencesDesc7":
            preferences = sortDescOrder3(preferences, "score");
            selectedTab = "preferences-tab";
            selectedTableName = "Preferences";
            break;
        }
      } else {
        offerings = sortAscOrder3(offerings, 'id');
        selectedTab = 'global-tab';
        selectedTableName = 'Global';
      }

      // Create a global table used in "spreadsheetView.edge" and "spreadsheet.edge"
      let globalTable = [];
      for (let i = 0; i < offerings.length; i++) {
        for (let j = 0; j < academics.length; j++) {
          // Add a matched object to the list if it exists in "global_spread",
          // otherwise add an object that is newly created to the list
          let isMatched = false;
          for (let k = 0; k < global_spread.length; k++) {
            if (
              offerings[i].code == global_spread[k].unitCode &&
              offerings[i].semester == global_spread[k].semester &&
              academics[j].id == global_spread[k].academicId
            ) {
              globalTable.push(global_spread[k]);
              isMatched = true;
              break;
            }
          }

          if (!isMatched) {
            globalTable.push({
              academicId: academics[j].id,
              name: academics[j].name,
              unitOfferingId: offerings[i].id,
              unitCode: offerings[i].code,
              semester: offerings[i].semester,
              fractionAllocated: 0,
            });
          }
        }
      }

      return view.render('spreadsheetView', {
        academics: academics,
        units: units,
        allocations: allocations,
        offerings: offerings,
        preferences: preferences,
        globalTable: globalTable,
        selectedTab: selectedTab,
        selectedTableName: selectedTableName,
      });
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }
}

module.exports = SpreadsheetViewController;
