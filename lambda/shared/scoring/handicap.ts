/**
 * Calculate course handicap from handicap index and slope rating.
 *
 * Formula: round((handicapIndex * slopeRating) / 113)
 *
 * 113 is the standard slope rating (USGA constant).
 *
 * @param handicapIndex - Player's GHIN handicap index (0.0 to 54.0)
 * @param slopeRating - Course slope rating (55 to 155, standard 113)
 * @returns Course handicap (integer)
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number
): number {
  return Math.round((handicapIndex * slopeRating) / 113);
}

/**
 * Calculate strokes received on a hole based on course handicap
 * and the hole's difficulty ranking.
 *
 * Stroke allocation rules:
 * - If courseHandicap >= holeHandicap: 1 stroke
 * - If courseHandicap > 18 AND holeHandicap <= (courseHandicap - 18): 2 strokes
 * - Otherwise: 0 strokes
 *
 * @param courseHandicap - Player's course handicap
 * @param holeHandicap - Hole's handicap ranking (1-18, 1 = hardest)
 * @returns Strokes received on this hole (0, 1, or 2)
 */
export function calculateStrokesReceived(
  courseHandicap: number,
  holeHandicap: number
): number {
  // Check for 2 strokes first (high handicap players)
  if (courseHandicap > 18) {
    const extraStrokes = courseHandicap - 18;
    if (holeHandicap <= extraStrokes) {
      return 2;
    }
  }

  // Check for 1 stroke
  if (holeHandicap <= courseHandicap) {
    return 1;
  }

  return 0;
}
