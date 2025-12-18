// Mock uuid module for Jest tests
let counter = 0;

export function v4(): string {
  counter++;
  return `mock-uuid-${counter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
