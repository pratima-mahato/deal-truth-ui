export const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "80 MB";

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
  "video/webm",
] as const;

export const ALLOWED_AUDIO_EXTENSION = /\.(mp3|wav|m4a|mp4|webm|ogg)$/i;

export const FORMAT_ACCEPT = ".mp3,.wav,.m4a,.mp4,.webm,.ogg,audio/*,video/mp4";
export const FORMAT_CHIP_LABEL = "mp3 wav m4a";
export const FORMAT_HINT = "mp3 · wav · m4a · webm · ogg";

export const FILE_REQUIRED_MESSAGE = "Choose an audio file.";
export const FILE_TOO_LARGE_MESSAGE = `File is larger than ${MAX_UPLOAD_LABEL}.`;
export const FILE_TYPE_MESSAGE = "Use mp3, wav, m4a, webm, or ogg.";
export const HTTPS_REQUIRED_MESSAGE = "Recording URL must be HTTPS.";

export type FileValidation = { ok: true } | { ok: false; message: string };

export function isHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value.trim());
}

export function validateAudioFile(file: File): FileValidation {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: FILE_TOO_LARGE_MESSAGE };
  }
  const extensionOk = ALLOWED_AUDIO_EXTENSION.test(file.name);
  if (!file.type) {
    return extensionOk ? { ok: true } : { ok: false, message: FILE_TYPE_MESSAGE };
  }
  const mimeOk =
    ALLOWED_AUDIO_MIME_TYPES.includes(file.type as (typeof ALLOWED_AUDIO_MIME_TYPES)[number]) ||
    file.type.startsWith("audio/") ||
    file.type.startsWith("video/");
  if (!mimeOk && !extensionOk) {
    return { ok: false, message: FILE_TYPE_MESSAGE };
  }
  return { ok: true };
}

export function parseTagList(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
