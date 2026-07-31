import { useEffect, useState } from "react";
import { api, Room } from "../api/client";

export function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.rooms
      .list()
      .then(setRooms)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Failed to load rooms: {error}</p>;

  return (
    <div>
      <h2>Rooms</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Floor</th>
            <th>Capacity</th>
            <th>Monthly rent</th>
            <th>Status</th>
            <th>Occupants</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.number}</td>
              <td>{room.floor}</td>
              <td>{room.capacity}</td>
              <td>₹{room.monthlyRent}</td>
              <td>
                <span className={`badge badge-${room.status.toLowerCase()}`}>{room.status}</span>
              </td>
              <td>{room.boarders?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
