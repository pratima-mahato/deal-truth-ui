import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  askCall,
  createCall,
  createShareLink,
  generateFollowUp,
  getCall,
  getCallRefusals,
  getCallReport,
  getCallsOverview,
  getDeal,
  getTranscript,
  listCalls,
  listRecommendations,
  patchSpeakers,
  processCall,
  reanalyzeCall,
  cancelCall,
  searchIntelligence,
  uploadCallAudio,
  registerSourceUrl,
  getSharedReport,
  resolveCallAudioSrc,
} from "@/api";
import { isTerminalStatus, type CreateCallRequest } from "@/api/contracts";

export function useCalls() {
  return useQuery({
    queryKey: ["calls"],
    queryFn: () => listCalls(),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some((call) => !isTerminalStatus(call.status)) ? 4000 : false;
    },
  });
}

export function useCall(callId: string) {
  return useQuery({
    queryKey: ["call", callId],
    queryFn: () => getCall(callId),
    enabled: !!callId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && !isTerminalStatus(status) ? 2000 : false;
    },
  });
}

export function useCallReport(callId: string, enabled = true) {
  return useQuery({
    queryKey: ["report", callId],
    queryFn: () => getCallReport(callId),
    enabled: !!callId && enabled,
    retry: false,
  });
}

export function useTranscript(callId: string, enabled = true) {
  return useQuery({
    queryKey: ["transcript", callId],
    queryFn: () => getTranscript(callId),
    enabled: !!callId && enabled,
    retry: false,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: listRecommendations,
    retry: false,
  });
}

export function useCallsOverview() {
  return useQuery({
    queryKey: ["calls", "overview"],
    queryFn: getCallsOverview,
    retry: false,
  });
}

export function useDeal(dealId: string) {
  return useQuery({
    queryKey: ["deal", dealId],
    queryFn: () => getDeal(dealId),
    enabled: !!dealId,
    retry: false,
  });
}

export function useCallRefusals(callId: string, enabled = true) {
  return useQuery({
    queryKey: ["refusals", callId],
    queryFn: () => getCallRefusals(callId),
    enabled: !!callId && enabled,
    retry: false,
  });
}

export function useCallAudioSrc(callId: string) {
  const query = useQuery({
    queryKey: ["audio-url", callId],
    queryFn: () => resolveCallAudioSrc(callId),
    enabled: !!callId,
    retry: false,
    staleTime: 60_000,
  });
  return query.data ?? "";
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => searchIntelligence({ q }),
    enabled: q.trim().length > 0,
    retry: false,
  });
}

export function useSharedReport(token: string) {
  return useQuery({
    queryKey: ["shared", token],
    queryFn: () => getSharedReport(token),
    enabled: !!token,
    retry: false,
  });
}

export function useUploadFlow() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCallRequest & { file?: File }) => {
      const created = await createCall(input);
      if (input.file) {
        await uploadCallAudio(created.id, input.file);
      } else if (input.sourceUrl) {
        await registerSourceUrl(created.id, input.sourceUrl);
      }
      await processCall(created.id);
      await client.invalidateQueries({ queryKey: ["calls"] });
      return created;
    },
  });
}

export function useSampleCall() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const created = await createCall({
        title: "Enterprise sales discovery (sample)",
        customerName: "Sarah Mitchell · Example Inc.",
        repName: "Rahul Mehta",
        callDirection: "outbound",
        sourceType: "sample",
      });
      await client.invalidateQueries({ queryKey: ["calls"] });
      return created;
    },
  });
}

export function useReanalyze(callId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => reanalyzeCall(callId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["call", callId] }),
  });
}

export function useCancel(callId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => cancelCall(callId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["call", callId] });
      void client.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

export function useShare(callId: string) {
  return useMutation({ mutationFn: () => createShareLink(callId) });
}

export function useAsk(callId: string) {
  return useMutation({ mutationFn: (question: string) => askCall(callId, question) });
}

export function useFollowUp(callId: string) {
  return useMutation({ mutationFn: () => generateFollowUp(callId) });
}

export function useSwapSpeakers(callId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const transcript = await getTranscript(callId);
      const seller = transcript.speakers.find((s) => s.role === "seller");
      const customer = transcript.speakers.find((s) => s.role === "customer");
      if (!seller || !customer) {
        throw new Error("Need both seller and customer speakers to swap roles.");
      }
      return patchSpeakers(callId, { speakerId: seller.id, swapWith: customer.id });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["transcript", callId] });
      void client.invalidateQueries({ queryKey: ["call", callId] });
    },
  });
}
