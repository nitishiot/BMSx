// Fee itemisation for exit check 3 ("cart shows an itemised fee
// breakdown"). No fee schedule exists in the PRD yet — this rate is a
// placeholder for demonstrating itemisation, not a business decision.
// [TBD: real service-fee rate/schedule]
const PLACEHOLDER_FEE_RATE = 0.1;

export function computeFeeMinorUnits(subtotalMinorUnits: number): number {
  return Math.round(subtotalMinorUnits * PLACEHOLDER_FEE_RATE);
}
