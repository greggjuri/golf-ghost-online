import {
  calculateCourseHandicap,
  calculateStrokesReceived,
} from '../handicap';

describe('calculateCourseHandicap', () => {
  it('should return 15 for handicap 15 at standard slope 113', () => {
    expect(calculateCourseHandicap(15.0, 113)).toBe(15);
  });

  it('should return 17 for handicap 15 at slope 130', () => {
    expect(calculateCourseHandicap(15.0, 130)).toBe(17);
  });

  it('should return 13 for handicap 15 at slope 96', () => {
    expect(calculateCourseHandicap(15.0, 96)).toBe(13);
  });

  it('should return 0 for scratch golfer', () => {
    expect(calculateCourseHandicap(0.0, 113)).toBe(0);
  });

  it('should return 36 for high handicap', () => {
    expect(calculateCourseHandicap(36.0, 113)).toBe(36);
  });

  it('should handle decimal handicaps with rounding', () => {
    expect(calculateCourseHandicap(15.4, 113)).toBe(15);
    expect(calculateCourseHandicap(15.6, 113)).toBe(16);
  });

  it('should handle maximum handicap of 54', () => {
    expect(calculateCourseHandicap(54.0, 113)).toBe(54);
  });

  it('should handle high slope rating', () => {
    expect(calculateCourseHandicap(15.0, 155)).toBe(21);
  });

  it('should handle low slope rating', () => {
    expect(calculateCourseHandicap(15.0, 55)).toBe(7);
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
