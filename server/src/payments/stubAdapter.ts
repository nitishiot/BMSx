// ADR-004 port/adapter: PSP selection is [TBD: PHASE_1_SPEC.md §8, item 2].
// This stub stands in for a real payment sandbox so the Orders & Cart saga
// (ADR-006) can be built and tested end to end without a PSP decision.
// Swap this module for a real PSP adapter once one is chosen — nothing
// outside this file should assume a stub is in use.
import { randomUUID } from 'node:crypto';

export interface AuthorizeRequest {
  amountMinorUnits: number;
  currency: string;
}

export interface AuthorizeResult {
  success: boolean;
  paymentIntentId: string;
  declineReason?: string;
}

// Test-only decline hook: an amount of exactly 111 (minor units) simulates
// a declined authorization, so checkout failure can be exercised without a
// real PSP's test-card conventions.
const SIMULATED_DECLINE_AMOUNT = 111;

export async function authorize(req: AuthorizeRequest): Promise<AuthorizeResult> {
  const paymentIntentId = `stub_${randomUUID()}`;
  if (req.amountMinorUnits === SIMULATED_DECLINE_AMOUNT) {
    return { success: false, paymentIntentId, declineReason: 'simulated_decline' };
  }
  return { success: true, paymentIntentId };
}
