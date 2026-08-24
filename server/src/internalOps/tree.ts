export interface OrgRoleRow {
  id: string;
  key: string;
  title: string;
  department: string | null;
  personName: string | null;
  reportsToOrgRoleId: string | null;
}

export interface OrgTreeNode {
  id: string;
  key: string;
  title: string;
  department: string | null;
  personName: string | null;
  children: OrgTreeNode[];
}

function toNode(row: OrgRoleRow): OrgTreeNode {
  return { id: row.id, key: row.key, title: row.title, department: row.department, personName: row.personName, children: [] };
}

// Builds the subtree rooted at `rootId` from a flat OrgRole row list —
// fine as plain JS recursion over ~35 rows rather than a recursive SQL
// CTE, at this scale (PHASE_2_SPEC.md §9: ~20 staff users max).
export function buildSubtree(rows: OrgRoleRow[], rootId: string): OrgTreeNode | null {
  const root = rows.find((r) => r.id === rootId);
  if (!root) return null;
  const node = toNode(root);
  node.children = rows.filter((r) => r.reportsToOrgRoleId === rootId).map((r) => buildSubtree(rows, r.id)!).filter(Boolean);
  return node;
}

// Full company forest — one tree per role with no manager (the two
// Founders, per PHASE_2_SPEC.md §5's "null only for the two Founders").
export function buildFullTree(rows: OrgRoleRow[]): OrgTreeNode[] {
  const roots = rows.filter((r) => r.reportsToOrgRoleId === null);
  return roots.map((r) => buildSubtree(rows, r.id)!).filter(Boolean);
}
