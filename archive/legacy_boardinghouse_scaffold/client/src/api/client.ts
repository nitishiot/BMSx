export type RoomStatus = "AVAILABLE" | "FULL" | "MAINTENANCE";
export type BoarderStatus = "ACTIVE" | "CHECKED_OUT";
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE";

export interface Room {
  id: string;
  number: string;
  floor: number;
  capacity: number;
  monthlyRent: string;
  status: RoomStatus;
  boarders?: Boarder[];
}

export interface Boarder {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  roomId: string | null;
  room?: Room | null;
  checkInDate: string;
  checkOutDate: string | null;
  status: BoarderStatus;
}

export interface Payment {
  id: string;
  boarderId: string;
  boarder?: Boarder;
  amount: string;
  dueDate: string;
  paidDate: string | null;
  status: PaymentStatus;
  method: string | null;
  note: string | null;
}

export interface DashboardSummary {
  totalRooms: number;
  occupiedRooms: number;
  activeBoarders: number;
  pendingPayments: number;
  overduePayments: number;
  outstandingAmount: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  rooms: {
    list: () => request<Room[]>("/rooms"),
    create: (data: Partial<Room>) =>
      request<Room>("/rooms", { method: "POST", body: JSON.stringify(data) }),
  },
  boarders: {
    list: () => request<Boarder[]>("/boarders"),
    create: (data: Partial<Boarder>) =>
      request<Boarder>("/boarders", { method: "POST", body: JSON.stringify(data) }),
    checkout: (id: string) => request<Boarder>(`/boarders/${id}/checkout`, { method: "POST" }),
  },
  payments: {
    list: () => request<Payment[]>("/payments"),
    create: (data: Partial<Payment>) =>
      request<Payment>("/payments", { method: "POST", body: JSON.stringify(data) }),
    markPaid: (id: string) => request<Payment>(`/payments/${id}/mark-paid`, { method: "POST" }),
  },
  dashboard: {
    summary: () => request<DashboardSummary>("/dashboard/summary"),
  },
};
