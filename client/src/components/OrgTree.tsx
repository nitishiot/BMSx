import { useState } from 'react';
import type { OrgTreeNode } from '../api';

// PHASE_1_IO_INCREMENT_SPEC.md §2/§6 — a real top-down org chart (parent
// -to-children connector lines, tier-coloured avatar chips) rather than
// an indented list, styled with the app's own theme tokens rather than
// inventing new colours. Modelled after a reference org-chart image
// Nitish shared (board→CEO→managers→staff, tier-coloured nodes,
// photo-circle avatars) — the connector-line/avatar/tier-colour *visual
// language* is taken from it, but no "Board of Directors" layer was
// added: the real org chart has two Founder roots with no board above
// them (see PHASE_1_IO_SPEC.md §2), and inventing one to match the
// reference more literally would misrepresent real company structure.
// Both roots render as siblings at the top of the same chart instead —
// see OrgForest below.
function initials(title: string, personName: string | null): string {
  const source = personName ?? title;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

// Cycles through the theme's four accent tokens by depth (--accent,
// --cool, --warm, --good — theme.css) so deeper tiers read as visually
// distinct without introducing any colour outside the existing palette.
const TIER_CLASSES = ['tier-0', 'tier-1', 'tier-2', 'tier-3'];
function tierClass(depth: number): string {
  return TIER_CLASSES[depth % TIER_CLASSES.length];
}

function OrgChartNode({ node, depth }: { node: OrgTreeNode; depth: number }) {
  const [collapsed, setCollapsed] = useState(depth >= 2);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className={`org-chart-card ${tierClass(depth)}`}>
        <span className="org-chart-avatar">{initials(node.title, node.personName)}</span>
        <span className="org-chart-title">{node.title}</span>
        {node.personName && <span className="org-chart-person">{node.personName}</span>}
        {node.department && <span className="org-chart-dept">{node.department}</span>}
        {hasChildren && (
          <button
            type="button"
            className="org-chart-toggle"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${node.title}'s reports` : `Collapse ${node.title}'s reports`}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? `+${node.children.length}` : '−'}
          </button>
        )}
      </div>
      {hasChildren && !collapsed && (
        <ul>
          {node.children.map((child) => (
            <OrgChartNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgTree({ node }: { node: OrgTreeNode }) {
  return (
    <div className="org-chart-scroll">
      <ul className="org-chart">
        <OrgChartNode node={node} depth={0} />
      </ul>
    </div>
  );
}

// Multiple top-level roots (the full company forest — the two Founders,
// per PHASE_1_IO_SPEC.md §5's "null only for the two Founders") rendered
// as siblings in one chart, not stacked as separate charts.
export function OrgForest({ nodes }: { nodes: OrgTreeNode[] }) {
  return (
    <div className="org-chart-scroll">
      <ul className="org-chart org-chart-forest">
        {nodes.map((node) => (
          <OrgChartNode key={node.id} node={node} depth={0} />
        ))}
      </ul>
    </div>
  );
}
