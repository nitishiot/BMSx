import { useEffect, useState } from "react";
import { api, DashboardSummary } from "../api/client";

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard
      .summary()
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Failed to load dashboard: {error}</p>;
  if (!summary) return <p>Loading...</p>;

  const stats = [
    { label: "Total rooms", value: summary.totalRooms },
    { label: "Occupied rooms", value: summary.occupiedRooms },
    { label: "Active boarders", value: summary.activeBoarders },
    { label: "Pending payments", value: summary.pendingPayments },
    { label: "Overdue payments", value: summary.overduePayments },
    { label: "Outstanding amount", value: `₹${summary.outstandingAmount}` },
  ];

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
