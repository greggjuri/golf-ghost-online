import { gaussianRandom } from '../gaussian';

describe('gaussianRandom', () => {
  it('should generate values with correct mean', () => {
    const samples = Array.from({ length: 10000 }, () => gaussianRandom(5, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeCloseTo(5, 0); // Within 0.5
  });

  it('should generate values with correct standard deviation', () => {
    const samples = Array.from({ length: 10000 }, () => gaussianRandom(0, 2));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance =
      samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
      samples.length;
    const stdDev = Math.sqrt(variance);
    expect(stdDev).toBeCloseTo(2, 0); // Within 0.5
  });

  it('should generate different values each call', () => {
    const a = gaussianRandom(0, 1);
    const b = gaussianRandom(0, 1);
    const c = gaussianRandom(0, 1);
    // Extremely unlikely to be equal
    expect(a === b && b === c).toBe(false);
  });

  it('should use default values of mean=0 and stdDev=1', () => {
    const samples = Array.from({ length: 10000 }, () => gaussianRandom());
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeCloseTo(0, 0);
  });

  it('should work with negative mean', () => {
    const samples = Array.from({ length: 10000 }, () => gaussianRandom(-5, 1));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeCloseTo(-5, 0);
  });
});
