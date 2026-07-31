import { useEffect, useState } from "react";
import { api, Boarder } from "../api/client";

export function Boarders() {
  const [boarders, setBoarders] = useState<Boarder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.boarders.list().then(setBoarders).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="error">Failed to load boarders: {error}</p>;

  return (
    <div>
      <h2>Boarders</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {boarders.map((boarder) => (
            <tr key={boarder.id}>
              <td>{boarder.name}</td>
              <td>{boarder.phone}</td>
              <td>{boarder.room?.number ?? "—"}</td>
              <td>{new Date(boarder.checkInDate).toLocaleDateString()}</td>
              <td>
                <span className={`badge badge-${boarder.status.toLowerCase()}`}>
                  {boarder.status}
                </span>
              </td>
              <td>
                {boarder.status === "ACTIVE" && (
                  <button
                    onClick={() =>
                      api.boarders.checkout(boarder.id).then(load).catch((err) => setError(err.message))
                    }
                  >
                    Check out
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
