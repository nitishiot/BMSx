import type { RoadmapFeature } from '../featureManifest';
import './RoadmapTeaser.css';

export function RoadmapTeaser({ features }: { features: RoadmapFeature[] }) {
  return (
    <section className="roadmap" aria-label="Upcoming producer features">
      <div className="roadmap-header">
        <p className="eyebrow">What's Next</p>
        <h2>More is coming to the Producer portal.</h2>
        <p className="roadmap-sub">
          Free-tier event setup is live today. These are next — greyed out
          because they're not built yet, not because they're not coming.
        </p>
      </div>
      <div className="roadmap-grid">
        {features.map((f) => (
          <div
            className="roadmap-item"
            role="group"
            aria-label={`${f.title} — coming soon, not yet built`}
            key={f.id}
          >
            <div className="roadmap-icon" aria-hidden="true">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className="roadmap-badge">Coming soon · {f.tier}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
