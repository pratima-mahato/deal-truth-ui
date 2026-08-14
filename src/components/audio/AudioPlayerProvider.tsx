import { env } from "@/config/env";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";

export type PlaybackRange = { startMs: number; endMs: number };

type AudioApi = {
  playRange: (startMs: number, endMs: number) => Promise<void>;
  playFrom: (logicalMs: number) => Promise<void>;
  seekTo: (startMs: number) => void;
  pause: () => void;
  toggle: () => void;
  skip: (deltaMs: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  currentMs: number;
  playing: boolean;
  durationMs: number;
  playbackRate: number;
  volume: number;
  activeRange: PlaybackRange | null;
  audioRef: RefObject<HTMLAudioElement | null>;
};

const AudioPlayerContext = createContext<AudioApi | null>(null);

export function AudioPlayerProvider({
  src,
  callDurationMs,
  children,
}: {
  src?: string;
  callDurationMs?: number;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const originRef = useRef({ logical: 0, file: 0 });
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fileDurationMs, setFileDurationMs] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [activeRange, setActiveRange] = useState<PlaybackRange | null>(null);
  const durationMs = callDurationMs && callDurationMs > 0 ? callDurationMs : fileDurationMs;

  const mapToFile = useCallback((startMs: number, endMs: number) => {
    if (!env.useMocks) {
      return { start: Math.max(0, startMs), end: Math.max(startMs, endMs) };
    }
    const duration = audioRef.current?.duration ? audioRef.current.duration * 1000 : 12000;
    const requested = Math.max(1500, endMs - startMs);
    if (startMs < duration) {
      return { start: startMs, end: Math.min(endMs, duration) };
    }
    const windowMs = Math.min(4000, requested, duration);
    const start = startMs % Math.max(duration - windowMs, 1);
    return { start, end: Math.min(start + windowMs, duration) };
  }, []);

  const playRange = useCallback(
    async (startMs: number, endMs: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      setActiveRange({ startMs, endMs });
      setCurrentMs(startMs);
      const mapped = mapToFile(startMs, endMs);
      originRef.current = { logical: startMs, file: mapped.start };
      stopAtRef.current = mapped.end;
      if (audio.readyState >= 1) {
        audio.currentTime = mapped.start / 1000;
      }
      try {
        await audio.play();
      } catch {
        await new Promise<void>((resolve) => {
          audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
          window.setTimeout(() => resolve(), 800);
        });
        audio.currentTime = mapToFile(startMs, endMs).start / 1000;
        await audio.play().catch(() => undefined);
      }
    },
    [mapToFile],
  );

  const playFrom = useCallback(
    async (logicalMs: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const start = Math.max(0, logicalMs);
      setActiveRange(null);
      setCurrentMs(start);
      const fileLen = audio.duration && Number.isFinite(audio.duration) ? audio.duration * 1000 : 0;
      const mapped = mapToFile(start, fileLen > 0 ? fileLen : start + 1);
      originRef.current = { logical: start, file: mapped.start };
      stopAtRef.current = null;
      if (audio.readyState >= 1) {
        audio.currentTime = mapped.start / 1000;
      }
      try {
        await audio.play();
      } catch {
        await new Promise<void>((resolve) => {
          audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
          window.setTimeout(() => resolve(), 800);
        });
        const again = mapToFile(start, audio.duration && Number.isFinite(audio.duration) ? audio.duration * 1000 : start + 1);
        originRef.current = { logical: start, file: again.start };
        audio.currentTime = again.start / 1000;
        await audio.play().catch(() => undefined);
      }
    },
    [mapToFile],
  );

  const seekTo = useCallback(
    (startMs: number) => {
      const clamped = Math.max(0, Math.min(startMs, durationMs || startMs));
      const audio = audioRef.current;
      if (!audio) return;
      const mapped = mapToFile(clamped, clamped + 1000);
      originRef.current = { logical: clamped, file: mapped.start };
      audio.currentTime = mapped.start / 1000;
      setCurrentMs(clamped);
    },
    [durationMs, mapToFile],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    const nearEnd = durationMs > 0 && currentMs >= durationMs - 250;
    void playFrom(nearEnd ? 0 : currentMs);
  }, [currentMs, durationMs, playFrom]);

  const skip = useCallback(
    (deltaMs: number) => {
      seekTo(currentMs + deltaMs);
    },
    [currentMs, seekTo],
  );

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  const setVolume = useCallback((next: number) => {
    const value = Math.min(1, Math.max(0, next));
    if (audioRef.current) audioRef.current.volume = value;
    setVolumeState(value);
  }, []);

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const fileMs = audio.currentTime * 1000;
    const { logical, file } = originRef.current;
    const nextLogical = Math.max(0, logical + (fileMs - file));
    setCurrentMs(nextLogical);
    if (stopAtRef.current != null && fileMs >= stopAtRef.current) {
      audio.pause();
      stopAtRef.current = null;
    }
  }, []);

  const value = useMemo<AudioApi>(
    () => ({
      playRange,
      playFrom,
      seekTo,
      pause,
      toggle,
      skip,
      setPlaybackRate,
      setVolume,
      currentMs,
      playing,
      durationMs,
      playbackRate,
      volume,
      activeRange,
      audioRef,
    }),
    [
      playRange,
      playFrom,
      seekTo,
      pause,
      toggle,
      skip,
      setPlaybackRate,
      setVolume,
      currentMs,
      playing,
      durationMs,
      playbackRate,
      volume,
      activeRange,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={env.useMocks ? "/demo-audio.wav" : src}
        preload="auto"
        playsInline
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setFileDurationMs(e.currentTarget.duration * 1000)}
      />
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioApi {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

export function useAudioPlayerOptional(): AudioApi | null {
  return useContext(AudioPlayerContext);
}
