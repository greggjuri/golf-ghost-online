import {
  calculateCourseHandicap,
  calculateStrokesReceived,
} from '../handicap';

describe('calculateCourseHandicap', () => {
  // Standard tests with courseRating = par (no adjustment)
  it('should return 15 for handicap 15 at standard slope 113 with neutral rating', () => {
    expect(calculateCourseHandicap(15.0, 113, 72, 72)).toBe(15);
  });

  it('should return 17 for handicap 15 at slope 130 with neutral rating', () => {
    expect(calculateCourseHandicap(15.0, 130, 72, 72)).toBe(17);
  });

  it('should return 13 for handicap 15 at slope 96 with neutral rating', () => {
    expect(calculateCourseHandicap(15.0, 96, 72, 72)).toBe(13);
  });

  it('should return 0 for scratch golfer with neutral rating', () => {
    expect(calculateCourseHandicap(0.0, 113, 72, 72)).toBe(0);
  });

  it('should return 36 for high handicap with neutral rating', () => {
    expect(calculateCourseHandicap(36.0, 113, 72, 72)).toBe(36);
  });

  it('should handle decimal handicaps with rounding', () => {
    expect(calculateCourseHandicap(15.4, 113, 72, 72)).toBe(15);
    expect(calculateCourseHandicap(15.6, 113, 72, 72)).toBe(16);
  });

  it('should handle maximum handicap of 54 with neutral rating', () => {
    expect(calculateCourseHandicap(54.0, 113, 72, 72)).toBe(54);
  });

  it('should handle high slope rating with neutral rating', () => {
    expect(calculateCourseHandicap(15.0, 155, 72, 72)).toBe(21);
  });

  it('should handle low slope rating with neutral rating', () => {
    expect(calculateCourseHandicap(15.0, 55, 72, 72)).toBe(7);
  });

  // Tests for course rating adjustment (USGA formula)
  it('should add strokes when course rating > par (harder course)', () => {
    // courseRating 74.5, par 72 = +2.5 adjustment
    // 15 * 113 / 113 + 2.5 = 17.5 -> rounds to 18
    expect(calculateCourseHandicap(15.0, 113, 74.5, 72)).toBe(18);
  });

  it('should subtract strokes when course rating < par (easier course)', () => {
    // courseRating 69.5, par 72 = -2.5 adjustment
    // 15 * 113 / 113 - 2.5 = 12.5 -> rounds to 13
    expect(calculateCourseHandicap(15.0, 113, 69.5, 72)).toBe(13);
  });

  it('should apply adjustment for scratch golfer on hard course', () => {
    // courseRating 75, par 72 = +3 adjustment
    // 0 * 113 / 113 + 3 = 3
    expect(calculateCourseHandicap(0.0, 113, 75, 72)).toBe(3);
  });

  it('should combine slope and rating adjustments correctly', () => {
    // handicap 15, slope 130, courseRating 74, par 72
    // 15 * 130 / 113 + 2 = 17.26 + 2 = 19.26 -> rounds to 19
    expect(calculateCourseHandicap(15.0, 130, 74, 72)).toBe(19);
  });
});

describe('calculateStrokesReceived', () => {
  it('should return 1 stroke when course hcp >= hole hcp', () => {
    expect(calculateStrokesReceived(10, 5)).toBe(1);
    expect(calculateStrokesReceived(10, 10)).toBe(1);
  });

  it('should return 0 strokes when course hcp < hole hcp', () => {
    expect(calculateStrokesReceived(10, 15)).toBe(0);
    expect(calculateStrokesReceived(10, 11)).toBe(0);
  });

  it('should return 2 strokes for high handicap on hard holes', () => {
    // Course hcp 20: extra strokes on holes 1-2
    expect(calculateStrokesReceived(20, 1)).toBe(2);
    expect(calculateStrokesReceived(20, 2)).toBe(2);
    expect(calculateStrokesReceived(20, 3)).toBe(1);
  });

  it('should return 2 strokes on all holes for course hcp 36', () => {
    // Course hcp 36: 18 extra strokes
    expect(calculateStrokesReceived(36, 1)).toBe(2);
    expect(calculateStrokesReceived(36, 18)).toBe(2);
  });

  it('should return 0 for scratch golfer', () => {
    expect(calculateStrokesReceived(0, 1)).toBe(0);
    expect(calculateStrokesReceived(0, 18)).toBe(0);
  });

  it('should return 1 for exactly 18 course handicap on all holes', () => {
    for (let hole = 1; hole <= 18; hole++) {
      expect(calculateStrokesReceived(18, hole)).toBe(1);
    }
  });

  it('should return correct strokes for course hcp 25', () => {
    // Extra strokes on holes 1-7 (25 - 18 = 7)
    expect(calculateStrokesReceived(25, 1)).toBe(2);
    expect(calculateStrokesReceived(25, 7)).toBe(2);
    expect(calculateStrokesReceived(25, 8)).toBe(1);
    expect(calculateStrokesReceived(25, 18)).toBe(1);
  });
});
