// Course data structure (from /old/golf_courses.json)
export interface CourseData {
  tee_name: string; // "Blue", "White", etc.
  course_rating: number; // e.g., 69.7
  slope_rating: number; // e.g., 126
  par_values: number[]; // 18 values
  hole_handicaps: number[]; // 18 values (1-18)
  yardages: number[]; // 18 values
}

// Score generation input
export interface ScoreInput {
  handicapIndex: number; // 0.0 to 54.0
  courseRating: number; // typically 67-77
  slopeRating: number; // 55-155, standard 113
  parValues: number[]; // 18 par values
  holeHandicaps: number[]; // 18 handicap rankings (1-18)
}

// Individual hole result
export interface HoleScore {
  hole: number; // 1-18
  par: number; // 3, 4, or 5
  grossScore: number; // Actual strokes taken
  strokesReceived: number; // 0, 1, or 2
  netScore: number; // grossScore - strokesReceived
}

// Complete round result
export interface GeneratedRound {
  id: string;
  scores: HoleScore[];
  courseHandicap: number;
  totalGross: number;
  totalNet: number;
  totalPar: number;
  createdAt: Date;
}

// Score type for coloring
export type ScoreType = 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple';

// Utility function for getting score type from score vs par
export function getScoreType(gross: number, par: number): ScoreType {
  const diff = gross - par;
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double';
  return 'triple';
}
