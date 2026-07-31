import { useEffect, useState } from "react";
import { api, Payment } from "../api/client";

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.payments.list().then(setPayments).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="error">Failed to load payments: {error}</p>;

  return (
    <div>
      <h2>Payments</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Boarder</th>
            <th>Amount</th>
            <th>Due date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.boarder?.name ?? payment.boarderId}</td>
              <td>₹{payment.amount}</td>
              <td>{new Date(payment.dueDate).toLocaleDateString()}</td>
              <td>
                <span className={`badge badge-${payment.status.toLowerCase()}`}>
                  {payment.status}
                </span>
              </td>
              <td>
                {payment.status !== "PAID" && (
                  <button
                    onClick={() =>
                      api.payments.markPaid(payment.id).then(load).catch((err) => setError(err.message))
                    }
                  >
                    Mark paid
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
