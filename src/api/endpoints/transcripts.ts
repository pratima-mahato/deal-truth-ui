import { type SpeakerPatchRequest, type Transcript } from "../contracts";
import { apiClient } from "../client";
import { mapTranscript, toSpeakerPatchBody } from "../adapters";

export async function getTranscript(callId: string): Promise<Transcript> {
  return mapTranscript(await apiClient.get(`/api/v1/calls/${callId}/transcript`));
}

export async function patchSpeakers(callId: string, body: SpeakerPatchRequest): Promise<Transcript> {
  return mapTranscript(await apiClient.patch(`/api/v1/calls/${callId}/speakers`, toSpeakerPatchBody(body)));
}
