/**
 * Preset course data for Golf Ghost Online
 * Data from /old/golf_courses.json with corrections
 */

export interface PresetCourse {
  id: string;
  name: string;
  teeName: string;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
  yardages: number[];
}

/**
 * Preset courses available for selection
 * Note: Hole 8 is par 5 (471/424 yards)
 */
export const PRESET_COURSES: PresetCourse[] = [
  {
    id: 'baytree-blue',
    name: 'Baytree National Golf Links',
    teeName: 'Blue',
    courseRating: 69.7,
    slopeRating: 126,
    parValues: [4, 3, 4, 3, 5, 4, 4, 5, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
    holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
    yardages: [349, 154, 308, 177, 488, 313, 365, 471, 352, 354, 313, 142, 520, 320, 374, 478, 148, 338],
  },
  {
    id: 'baytree-white',
    name: 'Baytree National Golf Links',
    teeName: 'White',
    courseRating: 66.9,
    slopeRating: 113,
    parValues: [4, 3, 4, 3, 5, 4, 4, 5, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
    holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
    yardages: [286, 126, 277, 124, 458, 274, 349, 424, 326, 282, 274, 128, 427, 293, 335, 429, 119, 311],
  },
];

/**
 * Get a preset course by ID
 */
export function getPresetCourse(id: string): PresetCourse | undefined {
  return PRESET_COURSES.find((course) => course.id === id);
}

/**
 * Get display name for a course (name + tee)
 */
export function getCourseDisplayName(course: PresetCourse): string {
  return `${course.name} (${course.teeName})`;
}

/**
 * Calculate total par for a course
 */
export function getTotalPar(parValues: number[]): number {
  return parValues.reduce((sum, par) => sum + par, 0);
}

/**
 * Calculate total yardage for a course
 */
export function getTotalYardage(yardages: number[]): number {
  return yardages.reduce((sum, yds) => sum + yds, 0);
}
