'use strict';

const Database = use('Database');
const Logger = use('Logger');
const Exception = use('App/Exceptions/Handler');

class DashboardController {
  // Display the dashboard
  async displayDashboard({ view }) {
    try {
      // Fetch allocations and offerings data from the database
      const allocations = await Database.from('allocations');
      const offerings = await Database.from('offerings');
      const preferences = await Database.from('preferences');

      // Convert "topAndBottom5AllocationsArray" into JSON string format
      const topAndBottom5AllocationsArray =
        this.generateTopAndBottom5Allocations(allocations, offerings);

      const allocationFulfillment = this.allocationFulfillment(allocations);

      const topAndBottom5AllocationsObject = Object.assign(
        {},
        topAndBottom5AllocationsArray,
      );
      const topAndBottom5AllocationsString = JSON.stringify(
        topAndBottom5AllocationsObject,
      );
      const willingnessAndExperienceJSON = JSON.stringify(
        this.willingnessAndExperience(allocations, offerings, preferences),
      );
      const cohort = this.fourlargestdiff(offerings);

      return view.render('dashboard', {
        topAndBottom5Allocations: topAndBottom5AllocationsString,
        allocationFulfillment: allocationFulfillment,
        allocationChartType: process.env.ALLOCATION_CHART_TYPE,
        willingnessAndExpertise: willingnessAndExperienceJSON,
        cohortdiffence: cohort,
      });
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }

  willingnessAndExperience(allocations, offerings, preferences) {
    try {
      let codes = [],
        willingness = [],
        experience = [];
      for (let offeringInd in offerings) {
        let offering = offerings[offeringInd];
        codes.push(offering['code'] + ' (' + offering['semester'] + ')');
        for (let allocationInd in allocations) {
          let allocation = allocations[allocationInd];
          if (offering['id'] == allocation['id']) {
            let countAssigned = 0,
              avgWilling = 0,
              avgExp = 0;
            for (let preferenceInd in preferences) {
              let preference = preferences[preferenceInd];
              if (preference['id'] == allocation['academicId']) {
                countAssigned++;
                avgWilling += preference['desireToTeach'];
                avgExp += preference['abilityToTeach'];
              }
            }
            willingness.push(
              countAssigned !== 0 ? avgWilling / countAssigned : 0,
            );
            experience.push(countAssigned !== 0 ? avgExp / countAssigned : 0);
          }
        }
        if (
          willingness[offeringInd] === undefined ||
          experience[offeringInd] === undefined
        ) {
          codes.pop();
        }
      }
      return {
        codes: codes,
        willingness: willingness,
        experience: experience,
      };
    } catch (error) {
      Logger.error(error);
      throw new Exception(error);
    }
  }

  allocationFulfillment(allocations) {
    const tol = Number(process.env.WELL_ALLOCATED_TOLERANCE);
    console.log(`Tolerance: ${tol}`);
    const allocationSummary = this.getAllocationSummary(allocations);
    let over = 0,
      under = 0,
      equal = 0,
      iterator = 0;
    // Sort the allocations before we iterate through them.
    // This will reduce the number of times we need to go through the loop.
    allocationSummary.sort(
      (a, b) => b.totalAllocatedFraction - a.totalAllocatedFraction,
    );
    console.log('Distribution cut-points:');
    // Count the number of overallocated units
    console.log(
      `${allocationSummary[iterator].totalAllocatedFraction} @ ${iterator}`,
    );
    while (
      allocationSummary[iterator].totalAllocatedFraction > 1 + tol &&
      iterator < allocationSummary.length - 1
    ) {
      over++;
      iterator++;
    }
    console.log(
      `${allocationSummary[iterator].totalAllocatedFraction} @ ${iterator}`,
    );
    // Count the number of well-allocated units
    while (
      allocationSummary[iterator].totalAllocatedFraction >= 1 - tol &&
      iterator < allocationSummary.length - 1
    ) {
      equal++;
      iterator++;
    }
    console.log(
      `${allocationSummary[iterator].totalAllocatedFraction} @ ${iterator}`,
    );
    // Count the number of underallocated units
    while (
      allocationSummary[iterator].totalAllocatedFraction < 1 - tol &&
      iterator < allocationSummary.length - 1
    ) {
      under++;
      iterator++;
    }
    console.log(
      `Distribution:\nUnder: ${under},\nEqual: ${equal},\nOver: ${over}`,
    );
    return [under, equal, over];
  }

  // Generate an array containing Top and Bottom 5 Allocations data
  generateTopAndBottom5Allocations(allocations, offerings) {
    // Calculate total allocated fraction by Unit Offering ID
    const allocationSummary = this.getAllocationSummary(allocations);

    // Sort "allocationSummary" in descending order using the value of "totalAllocatedFraction"
    allocationSummary.sort(
      (a, b) => b.totalAllocatedFraction - a.totalAllocatedFraction,
    );

    // Retrieve Top and Bottom 5 data in the value of "totalAllocatedFraction"
    const topAndBottom5Allocations = [];
    const top5Index = 5;
    const bottom5Index = allocationSummary.length - 5;
    for (let i = 0; i < top5Index; i++) {
      topAndBottom5Allocations.push(allocationSummary[i]);
    }
    for (let i = bottom5Index; i < allocationSummary.length; i++) {
      topAndBottom5Allocations.push(allocationSummary[i]);
    }

    // Add Unit Code and Semester data to "topAndBottom5Allocations" based on the offerings data
    for (let i = 0; i < topAndBottom5Allocations.length; i++) {
      for (let j = 0; j < offerings.length; j++) {
        if (topAndBottom5Allocations[i].unitOfferingId == offerings[j].id) {
          topAndBottom5Allocations[i].unitCode = offerings[j].code;
          topAndBottom5Allocations[i].semester = offerings[j].semester;
          break;
        }
      }
    }

    return topAndBottom5Allocations;
  }

  /*
   * Returns a summary of all allocations
   */
  getAllocationSummary(allocations) {
    const allocationSummary = [];
    for (let i = 0; i < allocations.length; i++) {
      if (i == 0) {
        allocationSummary.push({
          unitOfferingId: allocations[i].id,
          totalAllocatedFraction: allocations[i].fractionAllocated,
        });
        continue;
      }

      let isMatched = false;
      for (let j = 0; j < allocationSummary.length; j++) {
        if (allocations[i].id == allocationSummary[j].unitOfferingId) {
          allocationSummary[j].totalAllocatedFraction +=
            allocations[i].fractionAllocated;
          isMatched = true;
          break;
        }
      }
      if (!isMatched) {
        allocationSummary.push({
          unitOfferingId: allocations[i].id,
          totalAllocatedFraction: allocations[i].fractionAllocated,
        });
      }
    }
    return allocationSummary;
  }

  getCohortDifference(offerings) {
    let cohortchange = [];

    const targetdate1 = '2022/1';
    const targetdate2 = '2022/2';

    // looking for difference of cohort
    for (let i = 0; i < offerings.length; i++) {
      let cohort = [];
      cohort.push(i);
      //look for same unitcode as i
      for (let j = 0; j < offerings.length; j++) {
        if (i == j) {
          continue;
        }
        if (offerings[i].code == offerings[j].code) {
          cohort.push(j);
        }
      }
      let target1 = 0;
      let target2 = 0;
      //get amount of cohorts of targetdate
      for (let k = 0; k < cohort.length; k++) {
        if (offerings[cohort[k]].semester == targetdate1) {
          target1 = offerings[cohort[k]].estimatedEnrolments;
        } else if (offerings[cohort[k]].semester == targetdate2) {
          target2 = offerings[cohort[k]].estimatedEnrolments;
        }
      }
      if ((target1 == 0) | (target2 == 0)) {
        cohortchange.push({
          unitCode: offerings[i].code,
          cohort: 0,
          percentage: 0,
        });
      } else {
        cohortchange.push({
          unitCode: offerings[i].code,
          cohort: Math.abs(target2 - target1),
          percentage:
            Math.round(((target2 - target1) / target1) * 100 * 10) / 10,
        });
      }
    }
    return cohortchange;
  }
  removeDuplicatesByKey(arr, key) {
    return arr.filter(
      (obj, index, self) =>
        index === self.findIndex((o) => o[key] === obj[key]),
    );
  }
  fourlargestdiff(offerings) {
    let cohort = this.getCohortDifference(offerings);
    cohort = this.removeDuplicatesByKey(cohort, 'unitCode');
    // sort using cohort number
    cohort.sort((a, b) => b.percentage - a.percentage);
    // return cohort[0];

    return [
      cohort[0],
      cohort[1],
      cohort[cohort.length - 2],
      cohort[cohort.length - 1],
    ];
  }
}
module.exports = DashboardController;
