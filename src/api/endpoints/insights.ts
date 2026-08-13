import { type AskAnswer, type FollowUpEmail } from "../contracts";
import { apiClient } from "../client";
import { mapAsk, mapFollowUp } from "../adapters";

export async function askCall(callId: string, question: string): Promise<AskAnswer> {
  return mapAsk(
    await apiClient.post(`/api/v1/calls/${callId}/ask`, { question, top_k: 5, generate: false }),
  );
}

export async function generateFollowUp(callId: string): Promise<FollowUpEmail> {
  return mapFollowUp(await apiClient.post(`/api/v1/calls/${callId}/follow-up`));
}
