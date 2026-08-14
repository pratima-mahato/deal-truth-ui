import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadFlow } from "@/hooks/useCallApi";
import type { CallDirection } from "@/api/contracts";
import { CallDropZone } from "@/features/ingest/CallDropZone";

const MAX_BYTES = 80 * 1024 * 1024;
const ALLOWED = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/webm", "audio/ogg"];

export function UploadPage() {
  const navigate = useNavigate();
  const upload = useUploadFlow();
  const [tab, setTab] = useState("file");
  const [title, setTitle] = useState("Acme Inc. · Enterprise discovery");
  const [customerName, setCustomerName] = useState("Sarah Mitchell · Acme Inc.");
  const [repName, setRepName] = useState("Rahul Mehta");
  const [direction, setDirection] = useState<CallDirection>("outbound");
  const [competitors, setCompetitors] = useState("AcmeAI, VoiceForge");
  const [keywords, setKeywords] = useState("Salesforce, SOC 2, security");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    if (tab === "file") {
      if (!file) {
        setError("Choose an audio file.");
        return false;
      }
      if (file.size > MAX_BYTES) {
        setError("File is larger than 80 MB.");
        return false;
      }
      if (file.type && !ALLOWED.includes(file.type) && !/\.(mp3|wav|m4a|webm|ogg)$/i.test(file.name)) {
        setError("Use mp3, wav, m4a, webm, or ogg.");
        return false;
      }
    } else if (!/^https:\/\//i.test(sourceUrl)) {
      setError("Recording URL must be HTTPS.");
      return false;
    }
    setError(null);
    return true;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    upload.mutate(
      {
        title: title.trim() || file?.name.replace(/\.[^.]+$/, ""),
        customerName: customerName.trim() || undefined,
        repName: repName.trim() || undefined,
        callDirection: direction,
        sourceType: tab === "url" ? "source_url" : "upload",
        sourceUrl: tab === "url" ? sourceUrl : undefined,
        trackedCompetitors: competitors.split(",").map((s) => s.trim()).filter(Boolean),
        trackedKeywords: keywords.split(",").map((s) => s.trim()).filter(Boolean),
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
      <h1 className="serif" style={{ fontSize: 32, letterSpacing: "-.02em", marginBottom: 16 }}>
        Give it a recording. Get back notes you can defend.
      </h1>
      <form className="vstack" style={{ gap: 12 }} onSubmit={onSubmit}>
        <div className="card pad-lg">
          <div className="hstack" style={{ marginBottom: 10 }}>
            <button type="button" className={tab === "file" ? "chip brand" : "chip"} onClick={() => setTab("file")}>
              File
            </button>
            <button type="button" className={tab === "url" ? "chip brand" : "chip"} onClick={() => setTab("url")}>
              HTTPS link
            </button>
            <span className="chip">mp3 wav m4a</span>
          </div>
          {tab === "file" ? (
            <CallDropZone
              file={file}
              onFile={setFile}
              onAnalyze={() => {
                if (validate()) {
                  onSubmit({ preventDefault() {} } as FormEvent);
                }
              }}
              pending={upload.isPending}
              error={error}
            />
          ) : (
            <input className="inp" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
          )}
        </div>
        <div className="card pad-lg">
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Customer
          </div>
          <input className="inp" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div className="card pad-lg">
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Rep
          </div>
          <input className="inp" value={repName} onChange={(e) => setRepName(e.target.value)} />
        </div>
        <div className="card pad-lg">
          <div className="split" style={{ gap: 12 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Tracked competitors
              </div>
              <input className="inp" value={competitors} onChange={(e) => setCompetitors(e.target.value)} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Tracked keywords
              </div>
              <input className="inp" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="card pad-lg">
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Direction
          </div>
          <div className="hstack" style={{ marginBottom: 12 }}>
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
          <input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          {error ? <p className="tiny" style={{ marginTop: 10, color: "var(--blocker)" }}>{error}</p> : null}
          <div className="between" style={{ marginTop: 18 }}>
            <span className="tiny">Audio is sent for diarised transcription. Nothing else leaves your instance.</span>
            <button type="submit" className="btn primary" disabled={upload.isPending}>
              {upload.isPending ? "Starting…" : "Analyse call"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
