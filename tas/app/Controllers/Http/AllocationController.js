"use strict";

const Database = use("Database");
const Logger = use("Logger");
const Allocation = use("App/Models/Allocation");
const Offering = use("App/Models/Offering");
Database.query();

// Update the database with new allocations and academics
class AllocationController {
  async deleteallocation({ response, request }) {
    try {
      await Database.from("allocations")
        .where("academicId", request.input("academicId"))
        .delete();
    } catch (error) {
      Logger.error("Delete Allocation", error);
      throw new Exception();
    }
    return response.route("/allocations", true);
  }

  async updateAllocation({ response, request }) {
    try {
      await Database.from("allocations")
        .where("id", request.input("id"))
        .update({
          academicId: request.input("academicId"),
          fractionAllocated: request.input("fractionAllocated"),
          unitCoordinator: request.input("unitCoordinator"),
        });

      return response.route("/allocations", true);
    } catch (error) {
      Logger.error(`Update Allocation (${error})`);
    }
  }

  async addAllocation({ response, request }) {
    try {
      let offeringEntry = await Database.from("offerings")
        .where("code", request.input("unitCode"))
        .where("semester", request.input("semester"));

      // This if statement prevents a crash if no offering exists for the selected allocation semester
      if (offeringEntry.length == 0) {
        const newOffering = new Offering();
        const offeringLength = await Database.from("offerings").count();
        console.log(offeringLength[0].count);
        // Fills id values of offerings if any have been deleted
        let thisOfferingID = 0;
        for (let i = 1; i < offeringLength[0].count; i++) {
          const thisCheck = await Database.from("offerings").where("id", i);
          if (!thisCheck.length != 0) {
            thisOfferingID = i;
            break;
          }
        }

        newOffering.id = thisOfferingID;
        newOffering.code = request.input("unitCode");
        newOffering.semester = request.input("semester");

        // Todo: This could be done dynamically using a popup
        newOffering.estimatedEnrolments = 0;
        newOffering.schoolShare = 0;
        await newOffering.save();

        // Reallocate offering entry
        offeringEntry = await Database.from("offerings")
          .where("code", request.input("unitCode"))
          .where("semester", request.input("semester"));
        console.log(
          "Offering " +
            request.input("semester") +
            " doesn't exist for this Unit."
        );
        console.log("New Offering Created");
      }
      const newAllocation = new Allocation();
      newAllocation.academicId = request.input("academicId");
      newAllocation.id = offeringEntry[0]["id"];
      newAllocation.fractionAllocated = request.input("fractionAllocated");
      newAllocation.unitCoordinator = request.input("unitCoordinator");
      await newAllocation.save();
      return response.route("/allocations");
    } catch (error) {
      Logger.error(`Add Allocation (${error})`);
    }
  }

  // Auto Allocation
  async scoreAllocation({ response, request }) {
    try {
      // Delete all records
      await Database.from("allocations").delete();

      const autoAllocator = new AutoAllocatorController(
        process.env.WEIGHT_WILLINGNESS,
        process.env.WEIGHT_EXPERIENCE,
        process.env.WEIGHT_PRIOR
      );

      // Scoring based on preferences result
      let preferences = await Database.from("preferences");

      for (let preference of preferences) {
        const teachingFractionData = await Database.from("academics")
          .where("id", preference.id)
          .select("teachingFraction")
          .first();

        const offeringData = await Database.from("offerings")
          .where("code", preference.code)
          .where("semester", preference.preferredSemester)
          .select("estimatedEnrolments")
          .first();

        const estimatedEnrolments =
          (offeringData ? offeringData.estimatedEnrolments : 500) / 100;

        if (estimatedEnrolments - teachingFractionData.teachingFraction <= 0) {
          continue;
        }

        const allocationScore = autoAllocator.scoreAllocation(
          {
            willingness: preference.desireToTeach,
            expertise: preference.abilityToTeach,
            priorYears: preference.yearsOfPriorWork,
          },
          teachingFractionData.teachingFraction,
          estimatedEnrolments
        );

        // Update the preference score in the database
        await Database.from("preferences")
          .where("id", preference.id)
          .where("code", preference.code)
          .where("preferredSemester", preference.preferredSemester)
          .update({ score: allocationScore });
      }

      // Assigned academics to units
      preferences.sort((a, b) => b.score - a.score);

      // Assign allocations based on sorted preferences
      for (let preference of preferences) {
        const offeringEntry = await Database.from("offerings")
          .where("code", preference.code)
          .where("semester", preference.preferredSemester)
          .select("id")
          .first();

        if (offeringEntry) {
          const teachingFractionData = await Database.from("academics")
            .where("id", preference.id)
            .select("teachingFraction")
            .first();

          const newAllocation = new Allocation();
          newAllocation.academicId = preference.id;
          newAllocation.id = offeringEntry.id;
          newAllocation.fractionAllocated =
            teachingFractionData.teachingFraction;
          newAllocation.unitCoordinator = false;
          await newAllocation.save();
        }
      }

      //Fix fraction allocated score by the num of assigned units
      let academics = await Database.from("academics");

      for (const academic of academics) {
        const allocationData = await Database.from("allocations").where(
          "academicId",
          academic.id
        );

        const newTeachingFraction =
          academic.teachingFraction / allocationData.length;

        await Database.from("allocations")
          .where("academicId", academic.id)
          .update("fractionAllocated", newTeachingFraction);
      }
      return response.route("/allocations");
    } catch (error) {
      Logger.error(`Score Allocation Error: ${error.message}`);
      return response.json({
        success: false,
        message: "Error in scoring allocations",
      });
    }
  }

  async render({ view, request }) {
    try {
      // Obtain the searchbar input + options selected from the sorting + filtering
      let searchbar = request.input("searchbar");
      let sortOption = request.input("sortOption");
      let minEnrols = request.input("minEnrols");
      let maxEnrols = request.input("maxEnrols");
      let minShare = request.input("minShare");
      let maxShare = request.input("maxShare");
      let minTotal = request.input("minTotal");
      let maxTotal = request.input("maxTotal");

      // If no user input, use default sort + filter options
      if (!searchbar) {
        searchbar = "";
      }
      if (!sortOption) {
        sortOption = "code";
      }

      // Obtain from database
      let units = await Database.from("units").where(
        "code",
        "ilike",
        "%" + searchbar + "%"
      );
      let academics = await Database.from("academics");
      let offerings = await Database.from("offerings").where(
        "code",
        "ilike",
        "%" + searchbar + "%"
      );
      let allocations = await Database.from("allocations");

      // Obtain filtering options (Subject Area Group)
      let subjectAreaGroups = [];
      units.filter((unit) => {
        if (!subjectAreaGroups.includes(unit.subjectAreaGroup)) {
          subjectAreaGroups.push(unit.subjectAreaGroup);
        }
      });
      subjectAreaGroups.sort();

      let subjectAreaGroupsInput = [];
      let tickedCheckBoxes1 = [];
      for (const group of subjectAreaGroups) {
        // Tick certain checkboxes depending on if there are parameters related to Subject Area Group in URL
        const isTicked = request.input(group);
        if (isTicked) {
          tickedCheckBoxes1.push(group);
        }

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
      let reducedUnitCodes = units.map((unit) => unit.code);
      offerings = offerings.filter((offering) =>
        reducedUnitCodes.includes(offering.code)
      );

      // Obtain filtering options (Semester)
      let semesters = [];
      offerings.filter((offering) => {
        if (!semesters.includes(offering.semester)) {
          semesters.push(offering.semester);
        }
      });
      semesters.sort();

      let semestersInput = [];
      let tickedCheckBoxes2 = [];
      for (const sem of semesters) {
        // Tick certain checkboxes depending on if there are parameters related to Subject Area Group in URL
        const isTicked = request.input(sem);
        if (isTicked) {
          tickedCheckBoxes2.push(sem);
        }

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
          (offering) => offering.estimatedEnrolments >= minEnrols
        );
      }
      if (maxEnrols) {
        offerings = offerings.filter(
          (offering) => offering.estimatedEnrolments <= maxEnrols
        );
      }

      // Filtering schoolShare
      if (minShare) {
        offerings = offerings.filter(
          (offering) => offering.schoolShare >= minShare
        );
      }
      if (maxShare) {
        offerings = offerings.filter(
          (offering) => offering.schoolShare <= maxShare
        );
      }

      // Calculating total allocated fraction
      for (const offering of offerings) {
        let totalFraction = await Database.from("allocations")
          .where("id", offering.id)
          .sum("fractionAllocated");
        let totalFractionSum = totalFraction[0]["sum"];

        if (totalFractionSum == null) {
          offering.aggTotalFraction = 0;
        } else {
          offering.aggTotalFraction = totalFractionSum;
        }
      }

      // Helper function
      // Accepts the array and key
      const groupBy = (array, key) => {
        // Return the end result
        return array.reduce((result, currentValue) => {
          // If an array already present for key, push it to the array. Else create an array and push the object
          (result[currentValue[key]] = result[currentValue[key]] || []).push(
            currentValue
          );
          // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
          return result;
        }, {}); // Empty object is the initial value for result object
      };

      const aggAllocations = groupBy(allocations, "id");

      // Filtering total allocated fraction
      if (minTotal) {
        offerings = offerings.filter(
          (offering) => offering.aggTotalFraction >= minTotal
        );
      }
      if (maxTotal) {
        offerings = offerings.filter(
          (offering) => offering.aggTotalFraction <= maxTotal
        );
      }

      // Filtering out the same units in 'offerings' array as 'units' array
      reducedUnitCodes = offerings.map((offering) => offering.code);
      units = units.filter((unit) => reducedUnitCodes.includes(unit.code));

      // Sorting
      if (sortOption == "code") {
        offerings.sort((a, b) => a.code - b.code);
      }
      if (sortOption == "estimatedEnrolments") {
        offerings.sort((a, b) => a.estimatedEnrolments - b.estimatedEnrolments);
      }
      if (sortOption == "schoolShare") {
        offerings.sort((a, b) => a.schoolShare - b.schoolShare);
      }
      if (sortOption == "totalFrac") {
        let indices = aggTotalFractions.map(function (el, i) {
          return { index: i, value: el };
        });
        indices.sort((a, b) => a.value - b.value);
        offerings = indices.map((offering) => offerings[offering.index]);
      }

      return view.render("allocations", {
        academics: academics,
        units: units,
        allocations: allocations,
        offerings: offerings,
        aggAllocations: aggAllocations,
        subjectAreaGroups: subjectAreaGroups,
        tickedCheckBoxes1: tickedCheckBoxes1,
        semesters: semesters,
        tickedCheckBoxes2: tickedCheckBoxes2,
        minEnrols: minEnrols,
        maxEnrols: maxEnrols,
        minShare: minShare,
        maxShare: maxShare,
        minTotal: minTotal,
        maxTotal: maxTotal,
      });
    } catch (error) {
      Logger.error(`render Allocation (${error})`);
    }
  }
}

class AutoAllocatorController {
  constructor(willingWeight, expertiseWeight, priorWeight) {
    this.willingWeight = willingWeight;
    this.expertiseWeight = expertiseWeight;
    this.priorWeight = priorWeight;
  }

  scoreAllocation(allocationScores, timeAvailable, timeRequired) {
    const timeFitRatio = timeAvailable / timeRequired;

    // Return the weighted sum of the factors scaled according to how well the academic's availability matches the class's requirements
    return (
      (this.willingWeight * allocationScores.willingness +
        this.expertiseWeight * allocationScores.expertise +
        this.priorWeight * allocationScores.priorYears) *
      timeFitRatio
    );
  }
}

module.exports = AllocationController;
