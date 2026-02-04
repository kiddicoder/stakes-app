import { apiFetch } from "./api";

export type CreateCommitmentPayload = {
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate: string;
  checkInFrequency: "daily" | "weekly" | "one_time";
  stakesAmount: number;
  stakesCurrency?: string;
  stakesDestination?: string;
  refereeId?: string;
  charityId?: string;
  isPublic?: boolean;
};

export async function createCommitment(payload: CreateCommitmentPayload) {
  return apiFetch<{ item: unknown }>("/commitments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listCommitments() {
  return apiFetch<{ items: any[] }>("/commitments");
}

export async function getCommitment(id: string) {
  return apiFetch<{ item: any }>(`/commitments/${id}`);
}

export async function listCheckIns(commitmentId: string) {
  return apiFetch<{ items: any[] }>(`/commitments/${commitmentId}/check-ins`);
}

export async function createCheckIn(commitmentId: string, payload: {
  checkInDate: string;
  note?: string;
  proofPhotoUrl?: string;
  userReportedStatus: "success" | "failure";
}) {
  return apiFetch<{ item: any }>(`/commitments/${commitmentId}/check-ins`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
