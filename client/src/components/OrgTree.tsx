import type { OrgTreeNode } from '../api';

// One recursive component reused for both widget scopes (CTO's own
// subtree, Founder's full-company rollup) — the server decides which
// tree to send back, this just renders whatever it gets.
export function OrgTree({ node, depth = 0 }: { node: OrgTreeNode; depth?: number }) {
  return (
    <div className="org-tree-node" style={{ marginLeft: depth === 0 ? 0 : 18 }}>
      <div className="org-tree-row">
        <span className="org-tree-title">{node.title}</span>
        {node.personName && <span className="org-tree-person">{node.personName}</span>}
        {node.department && <span className="org-tree-dept">{node.department}</span>}
      </div>
      {node.children.length > 0 && (
        <div className="org-tree-children">
          {node.children.map((child) => (
            <OrgTree key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
