import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadFlow } from "@/hooks/useCallApi";
import type { CallDirection } from "@/api/contracts";
import { CallDropZone } from "@/features/ingest/CallDropZone";
import { TagInput } from "@/features/ingest/TagInput";
import {
  FILE_REQUIRED_MESSAGE,
  FORMAT_CHIP_LABEL,
  HTTPS_REQUIRED_MESSAGE,
  isHttpsUrl,
  validateAudioFile,
} from "@/features/ingest/constants";

type SourceTab = "file" | "url";

export function UploadPage() {
  const navigate = useNavigate();
  const upload = useUploadFlow();
  const [tab, setTab] = useState<SourceTab>("file");
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [repName, setRepName] = useState("");
  const [direction, setDirection] = useState<CallDirection>("outbound");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceReady = tab === "file" ? Boolean(file) : isHttpsUrl(sourceUrl);
  const apiError = upload.isError
    ? upload.error instanceof Error
      ? upload.error.message
      : "Upload failed."
    : null;
  const alertMessage = error || apiError;
  const urlInvalid = Boolean(sourceUrl.trim()) && !isHttpsUrl(sourceUrl);

  function validate(): boolean {
    if (tab === "file") {
      if (!file) {
        setError(FILE_REQUIRED_MESSAGE);
        return false;
      }
      const result = validateAudioFile(file);
      if (!result.ok) {
        setError(result.message);
        return false;
      }
    } else if (!isHttpsUrl(sourceUrl)) {
      setError(HTTPS_REQUIRED_MESSAGE);
      return false;
    }
    setError(null);
    return true;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    upload.mutate(
      {
        title: title.trim() || file?.name.replace(/\.[^.]+$/, "") || "Untitled call",
        customerName: customerName.trim() || undefined,
        repName: repName.trim() || undefined,
        callDirection: direction,
        sourceType: tab === "url" ? "source_url" : "upload",
        sourceUrl: tab === "url" ? sourceUrl.trim() : undefined,
        trackedCompetitors: competitors,
        trackedKeywords: keywords,
        file: tab === "file" ? file ?? undefined : undefined,
      },
      { onSuccess: (call) => navigate(`/calls/${call.id}/processing`) },
    );
  }

  return (
    <div className="page narrow">
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        New call
      </div>
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-.02em", marginBottom: 8 }}>
        Give it a recording. Get back notes you can defend.
      </h1>
      <p className="sub" style={{ marginBottom: 16, maxWidth: "52ch" }}>
        Drop audio or an HTTPS link. We transcribe, extract, and ship only claims that survive the evidence gate.
      </p>
      <form className="vstack" style={{ gap: 14 }} onSubmit={onSubmit}>
        <div className="card pad-lg">
          <div className="between" style={{ marginBottom: 12, flexWrap: "wrap" }}>
            <div className="eyebrow">Source</div>
            <div className="hstack" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className={tab === "file" ? "chip brand" : "chip"}
                onClick={() => {
                  setTab("file");
                  setError(null);
                }}
              >
                File
              </button>
              <button
                type="button"
                className={tab === "url" ? "chip brand" : "chip"}
                onClick={() => {
                  setTab("url");
                  setError(null);
                }}
              >
                HTTPS link
              </button>
              <span className="chip">{FORMAT_CHIP_LABEL}</span>
            </div>
          </div>
          {tab === "file" ? (
            <CallDropZone
              file={file}
              onFile={(next) => {
                setFile(next);
                setError(null);
              }}
              pending={upload.isPending}
              showAnalyze={false}
              showError={false}
              onReject={setError}
            />
          ) : (
            <div className="url-pane">
              <label className="field" htmlFor="source-url">
                <span className="eyebrow">Recording URL</span>
                <input
                  id="source-url"
                  className="inp big"
                  value={sourceUrl}
                  onChange={(event) => {
                    setSourceUrl(event.target.value);
                    setError(null);
                  }}
                  placeholder="https://recordings.example.com/call.mp3"
                  inputMode="url"
                  autoComplete="off"
                  aria-invalid={urlInvalid || error === HTTPS_REQUIRED_MESSAGE}
                  aria-describedby="source-url-hint"
                  onBlur={() => {
                    if (sourceUrl.trim() && !isHttpsUrl(sourceUrl)) setError(HTTPS_REQUIRED_MESSAGE);
                  }}
                />
                <span id="source-url-hint" className="tiny">
                  Must start with https://. Your instance fetches the file — the link is not opened in the browser.
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="card pad-lg">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Who and what to track
          </div>
          <div className="split" style={{ gap: 14 }}>
            <label className="field" htmlFor="customer-name">
              <span className="eyebrow">Customer</span>
              <input
                id="customer-name"
                className="inp"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Sarah Mitchell · Example Inc."
              />
            </label>
            <label className="field" htmlFor="rep-name">
              <span className="eyebrow">Rep</span>
              <input
                id="rep-name"
                className="inp"
                value={repName}
                onChange={(event) => setRepName(event.target.value)}
                placeholder="Rahul Mehta"
              />
            </label>
            <label className="field" htmlFor="tracked-competitors">
              <span className="eyebrow">Tracked competitors</span>
              <TagInput
                id="tracked-competitors"
                values={competitors}
                onChange={setCompetitors}
                placeholder="NexusAI, VoiceForge"
                disabled={upload.isPending}
              />
            </label>
            <label className="field" htmlFor="tracked-keywords">
              <span className="eyebrow">Tracked keywords</span>
              <TagInput
                id="tracked-keywords"
                values={keywords}
                onChange={setKeywords}
                placeholder="Salesforce, SOC 2, security"
                disabled={upload.isPending}
              />
            </label>
          </div>
        </div>

        <div className="card pad-lg">
          <div className="split" style={{ gap: 14, marginBottom: 14 }}>
            <div className="field">
              <span className="eyebrow" id="direction-label">
                Direction
              </span>
              <div className="hstack" role="group" aria-labelledby="direction-label">
                {(["outbound", "inbound"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={direction === value ? "chip brand" : "chip"}
                    onClick={() => setDirection(value)}
                  >
                    {value === "outbound" ? "Outbound" : "Inbound"}
                  </button>
                ))}
              </div>
            </div>
            <label className="field" htmlFor="call-title">
              <span className="eyebrow">Title</span>
              <input
                id="call-title"
                className="inp"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enterprise discovery"
              />
            </label>
          </div>
          {alertMessage ? (
            <p className="ingest-alert" role="alert">
              {alertMessage}
            </p>
          ) : null}
          <div className="between" style={{ marginTop: 18, flexWrap: "wrap" }}>
            <span className="tiny">Audio is sent for diarised transcription. Nothing else leaves your instance.</span>
            <button type="submit" className="btn primary" disabled={upload.isPending || !sourceReady}>
              {upload.isPending ? "Starting…" : "Analyse call"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
