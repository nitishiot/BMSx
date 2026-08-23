// Roadmap teaser manifest (LP-13 pattern, PHASE_1_SPEC.md §2) for the
// Producer portal. Copy sourced directly from TAG_PRD_v3.md §10's P1 list
// and J5's "optional Premium" step — never invented. Fan-facing items live
// in the separate landing/index.html manifest; this is the producer set.
export interface RoadmapFeature {
  id: string;
  icon: string;
  title: string;
  desc: string;
  tier: 'P1' | 'P2';
}

export const PRODUCER_FEATURE_MANIFEST: RoadmapFeature[] = [
  {
    id: 'premium-analytics',
    icon: '📊',
    title: 'Premium Analytics & Data',
    desc: 'Customer information access and attendee analytics (consent-gated).',
    tier: 'P1',
  },
  {
    id: 'demand-prediction',
    icon: '📈',
    title: 'AI Demand Prediction',
    desc: 'Forecast demand, pricing, and capacity ahead of your on-sale.',
    tier: 'P2',
  },
  {
    id: 'marketing-services',
    icon: '📣',
    title: 'Marketing Services',
    desc: 'Market directly to your audience through the platform.',
    tier: 'P1',
  },
  {
    id: 'personalised-page',
    icon: '🎨',
    title: 'Personalised Event Page',
    desc: 'A branded page for your festival, not a generic listing.',
    tier: 'P1',
  },
];
