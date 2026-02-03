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
