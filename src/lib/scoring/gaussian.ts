/**
 * Generate a random number from a Gaussian (normal) distribution
 * using the Box-Muller transform.
 *
 * Equivalent to Python's random.gauss(mean, std)
 *
 * @param mean - The mean of the distribution (default: 0)
 * @param stdDev - The standard deviation (default: 1)
 * @returns A random number from the Gaussian distribution
 */
export function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  return z0 * stdDev + mean;
}
