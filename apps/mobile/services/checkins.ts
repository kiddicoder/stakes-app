import { apiFetch } from "./api";

export type PendingVerificationItem = {
  checkIn: {
    id: string;
    checkInDate: string;
    note: string | null;
    userReportedStatus: "success" | "failure";
    createdAt: string;
  };
  commitment: {
    id: string;
    title: string;
    userId: string;
  };
};

export async function listPendingVerifications() {
  return apiFetch<{ items: PendingVerificationItem[] }>("/check-ins/pending-verification");
}

export async function verifyCheckIn(id: string, refereeNote?: string) {
  return apiFetch<{ item: unknown }>(`/check-ins/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ refereeNote: refereeNote?.trim() || undefined })
  });
}

export async function disputeCheckIn(id: string, refereeNote?: string) {
  return apiFetch<{ item: unknown }>(`/check-ins/${id}/dispute`, {
    method: "POST",
    body: JSON.stringify({ refereeNote: refereeNote?.trim() || undefined })
  });
}
