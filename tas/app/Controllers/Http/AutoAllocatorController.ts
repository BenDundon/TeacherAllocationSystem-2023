'use strict';
import formResponses from '../../Models/formResponses';

/**
 * Class to score an an allocation, and handle backend for the autoallocation.
 * Weights can be set in the ENV file, or manually when calling the class.
 * @param willingWeight [number] Balancing weight for academic willingness
 * @param expertiseWeight [number] Balancing weight for academic expertise
 * @param priorWeight [number] Balancing weight for years of  prior experience
 * @param timeAvailable [number] Amount of time the academic is available for
 * @param timeRequired [number] Required amount of time for the unit
 */
export default class AutoAllocatorController {
  constructor(
    private willingWeight: number,
    private expertiseWeight: number,
    private priorWeight: number,
  ) {}
  

  /**
   *
   * @param allocationScores [formResponses] An academic's preference form responses.
   * @param timeAvailable [number] Amount of time the academic is available for
   * @param timeRequired [number] Required amount of time for the unit
   * @returns Score: number
   */
  public scoreAllocation(
    allocationScores: formResponses,
    timeAvailable: number,
    timeRequired: number,
  ): number {
    // This multiplier will increase the total score if the person has more time available than the class requires,
    // and reduce it if they have less according to the magnitude of the difference.
    const timeFitRatio: number = timeAvailable / timeRequired;

    console.log(allocationScores);

    // Return the weighted sum of the factors scaled according to how well the academic's availability matches the class's requirements.
    return (
      (this.willingWeight * allocationScores.willingness +
        this.expertiseWeight * allocationScores.expertise +
        this.priorWeight * allocationScores.priorYears) *
      timeFitRatio
    );
  }

  // TODO: iterate through all academics who have filled the form for year x/sem y, allocate them to classes in that time period.
  public async asignAllocation(
    preferences: any[],
    timeAvailable: number,
    timeRequired: number,
  ): Promise<any> {
    //sort the score
    preferences.sort((a,b) => b.score - a.score);

    type AssignedAcademic = {
      academicsId: number;
      id: number;
      fractionAllocated: number;
    };
    
    const assignedAcademics: AssignedAcademic[] = [];

    for (const preference of preferences) {
      if (timeRequired <= 0) continue;

      assignedAcademics.push({
        academicsId: preference.academicId,
        id: preference.offeringId,
        fractionAllocated: preference.fractionAllocated
      });
    }

    timeRequired -= timeAvailable;
  }
}
