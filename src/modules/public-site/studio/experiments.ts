/** A bounded, seeded AR(1) illustration, independent of authenticated product engines. */
export function meanRevertingSeries(
  persistence: number,
  seed = 17,
  count = 61
): number[] {
  const phi = Math.max(0, Math.min(0.98, persistence));
  let state = seed >>> 0;
  let value = 0;
  return Array.from({ length: count }, () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const innovation = (state / 4294967296 - 0.5) * 2;
    value = phi * value + innovation;
    return value;
  });
}
