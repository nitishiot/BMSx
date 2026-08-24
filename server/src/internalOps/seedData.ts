// Org chart data (source: "FairFare Organization Chart", provided
// 2026-08-24; real names committed per Nitish's explicit confirmation —
// see PHASE_2_SPEC.md's header). Listed parent-before-child so a single
// upsert pass can resolve `reportsToKey` to an already-created row.
export interface OrgRoleSeed {
  key: string;
  title: string;
  department: string;
  personName?: string;
  reportsToKey?: string;
}

export const ORG_ROLES: OrgRoleSeed[] = [
  { key: 'founder_md', title: 'Founder & Managing Director', department: 'Executive', personName: 'Ila Nicholson' },
  { key: 'founder_creative', title: 'Founder & Creative Director', department: 'Executive', personName: 'Shane Mitchell' },

  // --- Under Founder & Managing Director ---
  { key: 'cfo', title: 'CFO', department: 'Finance', personName: 'Jon Abelarde', reportsToKey: 'founder_md' },
  { key: 'cfo_analyst_1', title: 'Analyst', department: 'Finance', reportsToKey: 'cfo' },
  { key: 'cfo_analyst_2', title: 'Analyst', department: 'Finance', reportsToKey: 'cfo' },
  { key: 'cfo_analyst_3', title: 'Analyst', department: 'Finance', reportsToKey: 'cfo' },
  { key: 'cio', title: 'CIO', department: 'Information', reportsToKey: 'founder_md' },
  { key: 'cio_analyst', title: 'Analyst', department: 'Information', reportsToKey: 'cio' },
  { key: 'cao', title: 'CAO', department: 'Administration', reportsToKey: 'founder_md' },
  { key: 'cao_hr', title: 'HR', department: 'Administration', reportsToKey: 'cao' },
  { key: 'accounting', title: 'Accounting', department: 'Finance', personName: 'Gilroy & Gannon', reportsToKey: 'founder_md' },
  { key: 'legal', title: 'Legal', department: 'Legal', personName: 'LK Sheilds', reportsToKey: 'founder_md' },
  { key: 'vp_ticketing_strategy', title: 'VP Ticketing Strategy', department: 'Ticketing', personName: 'TJ Chambers', reportsToKey: 'founder_md' },
  { key: 'cto', title: 'CTO', department: 'Product & Technology', personName: 'Satish Billakota', reportsToKey: 'founder_md' },
  { key: 'head_of_product_dev', title: 'Head of Product Development', department: 'Product & Technology', personName: 'Nitish Gupta', reportsToKey: 'cto' },
  { key: 'vp_of_tech', title: 'VP of Tech', department: 'Product & Technology', personName: 'Khadir Fayaz', reportsToKey: 'cto' },
  { key: 'fintech', title: 'FinTech', department: 'Product & Technology', reportsToKey: 'vp_of_tech' },
  { key: 'fintech_jr_tech', title: 'Jr Tech', department: 'Product & Technology', reportsToKey: 'fintech' },
  { key: 'ecommerce', title: 'E-Commerce', department: 'Product & Technology', reportsToKey: 'vp_of_tech' },
  { key: 'ecommerce_jr_tech', title: 'Jr Tech', department: 'Product & Technology', reportsToKey: 'ecommerce' },
  { key: 'app_development', title: 'App Development', department: 'Product & Technology', reportsToKey: 'vp_of_tech' },
  { key: 'cloud_team', title: 'Cloud Team', department: 'Product & Technology', reportsToKey: 'app_development' },

  // --- Under Founder & Creative Director ---
  { key: 'branding_director', title: 'Branding Director', department: 'Marketing', personName: 'Malcolm Gaskin', reportsToKey: 'founder_creative' },
  { key: 'marketing_manager', title: 'Marketing Manager', department: 'Marketing', reportsToKey: 'branding_director' },
  { key: 'corporate_marketing', title: 'Corporate Marketing', department: 'Marketing', reportsToKey: 'marketing_manager' },
  { key: 'marketing_affiliates', title: 'Marketing Affiliates', department: 'Marketing', reportsToKey: 'branding_director' },
  { key: 'event_marketing', title: 'Event Marketing', department: 'Marketing', reportsToKey: 'marketing_affiliates' },
  { key: 'events_manager', title: 'Events Manager', department: 'Events & Ticketing Ops', reportsToKey: 'founder_creative' },
  { key: 'lead_promoter', title: 'Lead Promoter', department: 'Events & Ticketing Ops', reportsToKey: 'events_manager' },
  { key: 'event_coord_1', title: 'Event Coord', department: 'Events & Ticketing Ops', reportsToKey: 'lead_promoter' },
  { key: 'local_coord', title: 'Local Coord', department: 'Events & Ticketing Ops', reportsToKey: 'events_manager' },
  { key: 'event_coord_2', title: 'Event Coord', department: 'Events & Ticketing Ops', reportsToKey: 'local_coord' },
  { key: 'festivals_leader', title: 'Festivals Leader', department: 'Events & Ticketing Ops', reportsToKey: 'founder_creative' },
  { key: 'ticketing_ops_manager', title: 'Ticketing Operations Manager', department: 'Events & Ticketing Ops', reportsToKey: 'founder_creative' },
  { key: 'festival_specialist', title: 'Festival Specialist', department: 'Events & Ticketing Ops', personName: 'Chris Prosser', reportsToKey: 'founder_creative' },
];

export interface CapabilitySeed {
  key: string;
  description: string;
}

export const CAPABILITIES: CapabilitySeed[] = [
  { key: 'view_product_roadmap', description: 'View and edit the P1/P2 product roadmap manifest' },
  { key: 'view_engineering_roster', description: "View the caller's engineering org subtree" },
  { key: 'manage_team', description: "Manage (edit) the caller's own reporting subtree" },
  { key: 'view_company_rollup', description: 'View the full company org tree and company-wide metrics panel' },
];

// PHASE_2_SPEC.md §7 — capability grants for the three priority roles.
// Founder & Managing Director gets every capability ("superset").
export const ORG_ROLE_CAPABILITIES: Record<string, string[]> = {
  head_of_product_dev: ['view_product_roadmap'],
  cto: ['view_engineering_roster', 'manage_team'],
  founder_md: ['view_product_roadmap', 'view_engineering_roster', 'manage_team', 'view_company_rollup'],
};
