import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { useUploadFlow } from "@/hooks/useCallApi";
import type { CallDirection } from "@/api/contracts";

const MAX_BYTES = 80 * 1024 * 1024;
const ALLOWED = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/webm", "audio/ogg"];

export function UploadPage() {
  const navigate = useNavigate();
  const upload = useUploadFlow();
  const [tab, setTab] = useState("file");
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [repName, setRepName] = useState("");
  const [direction, setDirection] = useState<CallDirection>("outbound");
  const [competitors, setCompetitors] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(): boolean {
    if (!title.trim()) {
      setError("Title is required.");
      return false;
    }
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
        title: title.trim(),
        customerName: customerName.trim() || undefined,
        repName: repName.trim() || undefined,
        callDirection: direction,
        sourceType: tab === "url" ? "source_url" : "upload",
        sourceUrl: tab === "url" ? sourceUrl : undefined,
        trackedCompetitors: competitors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        file: tab === "file" ? file ?? undefined : undefined,
      },
      {
        onSuccess: (call) => navigate(`/calls/${call.id}/processing`),
      },
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Upload a call" description="Audio stays on the API. This app only sends the file over HTTP." />
      <Card className="p-4 sm:p-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Tabs
            tabs={[
              { id: "file", label: "File upload" },
              { id: "url", label: "Recording URL" },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === "file" ? (
            <Field label="Audio file" htmlFor="file">
              <Input
                id="file"
                type="file"
                accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Field>
          ) : (
            <Field label="HTTPS recording URL" htmlFor="url">
              <Input
                id="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://…"
              />
            </Field>
          )}
          <Field label="Title" htmlFor="title">
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Acme discovery" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer" htmlFor="customer">
              <Input id="customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </Field>
            <Field label="Rep" htmlFor="rep">
              <Input id="rep" value={repName} onChange={(e) => setRepName(e.target.value)} />
            </Field>
          </div>
          <Field label="Direction" htmlFor="direction">
            <Select
              id="direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as CallDirection)}
            >
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
              <option value="internal">Internal</option>
              <option value="unknown">Unknown</option>
            </Select>
          </Field>
          <Field label="Tracked competitors" htmlFor="comp">
            <Input
              id="comp"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Comma-separated"
            />
          </Field>
          {error ? <Alert tone="danger" title={error} /> : null}
          {upload.isError ? (
            <Alert tone="danger" title="Upload failed">
              {upload.error instanceof Error ? upload.error.message : "Try again."}
            </Alert>
          ) : null}
          <Button type="submit" disabled={upload.isPending} className="w-full sm:w-auto">
            {upload.isPending ? "Starting analysis…" : "Process call"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
