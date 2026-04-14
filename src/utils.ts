export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
