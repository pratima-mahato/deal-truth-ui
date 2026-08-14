import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CallDropZone } from "./CallDropZone";
import {
  FILE_TOO_LARGE_MESSAGE,
  FILE_TYPE_MESSAGE,
  MAX_UPLOAD_BYTES,
  validateAudioFile,
} from "./constants";

function fileWith(name: string, type: string, size: number): File {
  const file = new File(["ok"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateAudioFile", () => {
  it("rejects files over the size cap", () => {
    expect(validateAudioFile(fileWith("call.mp3", "audio/mpeg", MAX_UPLOAD_BYTES + 1))).toEqual({
      ok: false,
      message: FILE_TOO_LARGE_MESSAGE,
    });
  });

  it("rejects disallowed types", () => {
    expect(validateAudioFile(fileWith("notes.pdf", "application/pdf", 1024))).toEqual({
      ok: false,
      message: FILE_TYPE_MESSAGE,
    });
  });

  it("accepts an mp3 under the cap", () => {
    expect(validateAudioFile(fileWith("call.mp3", "audio/mpeg", 2048)).ok).toBe(true);
  });
});

describe("CallDropZone", () => {
  it("surfaces type errors instead of failing silently", () => {
    const onFile = vi.fn();
    const onReject = vi.fn();
    render(<CallDropZone file={null} onFile={onFile} onReject={onReject} />);

    const input = screen.getByLabelText("Upload a call recording");
    fireEvent.change(input, { target: { files: [fileWith("notes.pdf", "application/pdf", 2048)] } });

    expect(onFile).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith(FILE_TYPE_MESSAGE);
    expect(screen.getByRole("alert")).toHaveTextContent(FILE_TYPE_MESSAGE);
  });

  it("keeps analyse on the workspace selected state", () => {
    render(
      <CallDropZone
        file={fileWith("call.mp3", "audio/mpeg", 2048)}
        onFile={vi.fn()}
        onAnalyze={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /analyse call/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose another/i })).toBeInTheDocument();
  });

  it("hides the nested analyse CTA when the parent form owns submit", () => {
    render(
      <CallDropZone
        file={fileWith("call.mp3", "audio/mpeg", 2048)}
        onFile={vi.fn()}
        showAnalyze={false}
      />,
    );
    expect(screen.queryByRole("button", { name: /analyse call/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Drop a recording, or click to browse")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose another/i })).toBeInTheDocument();
  });
});
