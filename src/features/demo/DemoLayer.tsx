import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { env } from "@/config/env";
import { toggleTheme } from "@/lib/theme";
import { demoCloseCrm, demoOpenCrm, demoPlaySeg, demoSetView } from "./demoEvents";

const CALL = env.demoCallId;
const BEAT_COUNT = 13;
const SPOT_SETTLE_MS = 520;
const DEFAULT_BEAT_DELAY_MS = 420;
const AUTO_HOLD_MS = 7000;
const COLD_R = 66;
const COLD_STATES = ["proven", "proven", "missing", "missing", "missing", "blocked", "blocked", "blocked"] as const;
const COLD_COLOUR: Record<(typeof COLD_STATES)[number], string> = {
  proven: "var(--green-500)",
  blocked: "var(--red-500)",
  missing: "var(--ink-300)",
};

type Beat = {
  cap: string;
  sub: string;
  go: () => void;
  spot: string | null;
  wait?: number;
};

type Cmd = {
  label: string;
  keys: string;
  hint: string;
  run: () => void;
};

function highlightBrand(text: string) {
  const brand = "Deal Truth";
  const at = text.indexOf(brand);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="mark-saffron">{brand}</span>
      {text.slice(at + brand.length)}
    </>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function DemoLayer() {
  const navigate = useNavigate();
  const [cold, setCold] = useState(() => typeof navigator === "undefined" || !navigator.webdriver);
  const [presenting, setPresenting] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [cmdSel, setCmdSel] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const startPresentationRef = useRef<() => void>(() => {});
  const tokenRef = useRef(0);
  const autoRef = useRef(false);
  const presentingRef = useRef(false);
  const beatRef = useRef(0);
  const timers = useRef<number[]>([]);

  const goCall = useCallback(
    (view?: string) => {
      navigate(`/calls/${CALL}/${view ?? "verdict"}`);
    },
    [navigate],
  );

  const beats: Beat[] = [
      {
        cap: "Deal Truth does this without a $1,400 seat.",
        sub: "Six calls, analysed. Every claim in here is backed by audio you can play.",
        go: () => navigate("/"),
        spot: ".rows",
      },
      {
        cap: "Drop a call. Watch the gate work.",
        sub: "Not a progress bar — a live log of every claim being checked against the transcript.",
        go: () => navigate(`/calls/${CALL}/processing`),
        spot: "#gatelog",
        wait: 7200,
      },
      {
        cap: "Four claims never made it out.",
        sub: "The model wanted to ship them. The evidence gate refused all four, and kept the reason.",
        go: () => {},
        spot: "#gatelog",
      },
      {
        cap: "Here is the deal, in one sentence.",
        sub: "Strong product fit — blocked by a security review, a live competitor, and a meeting the customer refused to book.",
        go: () => goCall("verdict"),
        spot: "#mainView .card",
      },
      {
        cap: "Eight dimensions. Two proven. No invented score.",
        sub: "Every other tool invents a close score. We show you what was actually said, and what was never mentioned.",
        go: () => demoSetView("verdict"),
        spot: ".ring-wrap",
      },
      {
        cap: "“But AI summaries hallucinate.”",
        sub: "Click any claim in this product and you hear the customer say it. Press Next — the audio plays.",
        go: () => {},
        spot: "#mainView .receipt",
      },
      {
        cap: "That is her voice, not our summary.",
        sub: "Six hours a week, quantified by the customer, unprompted. The transcript scrolled to it and the waveform marked it.",
        go: () => demoPlaySeg("sg14"),
        spot: ".seg.focus",
      },
      {
        cap: "Now the part that sells the product.",
        sub: "The rep left this call believing it closes this month. Here is what the customer actually said, 23 seconds later.",
        go: () => {},
        spot: ".reality",
      },
      {
        cap: "Rep: “ready to purchase this month.”",
        sub: "Customer: “we still need to evaluate two other vendors, and security has to sign off.” Both playable. Both timestamped.",
        go: () => demoPlaySeg("sg42"),
        spot: ".reality",
      },
      {
        cap: "The follow-up email refuses to send.",
        sub: "One sentence claims a meeting the customer never agreed to. The gate locks the button until it is removed.",
        go: () => demoSetView("act"),
        spot: ".emailline.bad",
      },
      {
        cap: "The same gate runs on your CRM.",
        sub: "Seven fields carry a quote. Three we refuse to guess. One is blocked — writing a meeting nobody agreed to would create a commitment that does not exist.",
        go: () => demoOpenCrm(),
        spot: "#crmModal",
      },
      {
        cap: "This deal peaked eight days ago.",
        sub: "Three calls. It lost its timeline and its next meeting, and gained a security blocker. Nobody noticed, because nobody re-read the last call.",
        go: () => {
          demoCloseCrm();
          navigate("/deals/acme");
        },
        spot: ".matrix",
      },
      {
        cap: "Deal Truth. Open source. Runs on PyAI.",
        sub: "Notes with receipts, a gate that blocks, and a deal timeline made of things people actually said. git clone and it runs.",
        go: () => navigate("/demo"),
        spot: null,
      },
  ];

  const commands: Cmd[] = useMemo(
    () => [
      { label: "Workspace — all calls", keys: "G W", hint: "workspace", run: () => navigate("/") },
      { label: "Search every call", keys: "G S", hint: "search", run: () => navigate("/search") },
      { label: "Upload a call", keys: "", hint: "upload", run: () => navigate("/upload") },
      { label: "Processing — watch the gate", keys: "", hint: "processing", run: () => navigate(`/calls/${CALL}/processing`) },
      { label: "Verdict — the Acme call", keys: "G C", hint: "call", run: () => goCall("verdict") },
      { label: "The record — moments, sentiment, objections", keys: "", hint: "record", run: () => goCall("record") },
      { label: "What to do — battlecard, commitments, email", keys: "", hint: "act", run: () => goCall("act") },
      { label: "Manager brief", keys: "", hint: "brief", run: () => goCall("brief") },
      { label: "Deal timeline — how Acme moved", keys: "G D", hint: "deal", run: () => navigate("/deals/acme") },
      { label: "Integrations — HubSpot & Slack", keys: "", hint: "integrations", run: () => navigate("/integrations") },
      { label: "Send to HubSpot — evidence-gated", keys: "", hint: "crm", run: () => { goCall("verdict"); window.setTimeout(() => demoOpenCrm(), 300); } },
      { label: "Shared report — what the customer sees", keys: "", hint: "shared", run: () => navigate("/demo") },
      { label: "▶ Run the 90-second presentation", keys: "P", hint: "present demo", run: () => startPresentationRef.current() },
      { label: "Toggle light / dark", keys: "D", hint: "theme", run: () => toggleTheme() },
      { label: "Hear: “6 hours every week” — the pain", keys: "", hint: "pain evidence", run: () => { goCall("verdict"); window.setTimeout(() => demoPlaySeg("sg14"), 400); } },
      { label: "Hear: “almost double” — the pricing objection", keys: "", hint: "price evidence", run: () => { goCall("verdict"); window.setTimeout(() => demoPlaySeg("sg24"), 400); } },
      { label: "Hear: “security has to sign off” — the blocker", keys: "", hint: "security evidence", run: () => { goCall("verdict"); window.setTimeout(() => demoPlaySeg("sg42"), 400); } },
      { label: "Hear: “send me something” — the refused meeting", keys: "", hint: "meeting evidence", run: () => { goCall("verdict"); window.setTimeout(() => demoPlaySeg("sg46"), 400); } },
    ],
    [goCall, navigate],
  );

  const cmdRows = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q));
  }, [cmdQuery, commands]);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  function clearSpot() {
    document.querySelectorAll(".spotlight").forEach((el) => el.classList.remove("spotlight"));
  }

  function landSpot(selector: string | null, token: number, delay: number) {
    if (!selector) return;
    later(() => {
      if (tokenRef.current !== token || !presentingRef.current) return;
      const tryLand = (attempt: number) => {
        if (tokenRef.current !== token || !presentingRef.current) return;
        const el = document.querySelector(selector);
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          later(() => {
            if (tokenRef.current === token && presentingRef.current) el.classList.add("spotlight");
          }, SPOT_SETTLE_MS);
          return;
        }
        if (attempt < 16) later(() => tryLand(attempt + 1), 120);
      };
      tryLand(0);
    }, delay);
  }

  const endPresentation = useCallback(() => {
    presentingRef.current = false;
    autoRef.current = false;
    setPresenting(false);
    setAuto(false);
    clearTimers();
    clearSpot();
    document.documentElement.classList.remove("presenting");
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  function applyBeat(index: number) {
    const token = ++tokenRef.current;
    beatRef.current = index;
    setBeatIndex(index);
    clearTimers();
    clearSpot();
    const beat = beats[index];
    if (!beat) return;
    try {
      beat.go();
    } catch {
      /* navigation during teardown is fine */
    }
    landSpot(beat.spot, token, beat.wait ?? DEFAULT_BEAT_DELAY_MS);
    if (autoRef.current) {
      later(() => step(1), (beat.wait ?? 0) + AUTO_HOLD_MS);
    }
  }

  function step(delta: number) {
    if (!presentingRef.current) return;
    const next = beatRef.current + delta;
    if (next < 0) return;
    if (next >= beats.length) {
      endPresentation();
      showToast("That is the demo. 90 seconds, no slides.");
      return;
    }
    applyBeat(next);
  }

  function startPresentation() {
    setCold(false);
    presentingRef.current = true;
    autoRef.current = false;
    beatRef.current = -1;
    setPresenting(true);
    setAuto(false);
    document.documentElement.classList.add("presenting");
    applyBeat(0);
  }
  startPresentationRef.current = startPresentation;

  function closePalette() {
    cmdInputRef.current?.blur();
    setCmdOpen(false);
    setCmdQuery("");
    setCmdSel(0);
  }

  function openPalette() {
    setCmdOpen(true);
    setCmdQuery("");
    setCmdSel(0);
    window.setTimeout(() => cmdInputRef.current?.focus(), 40);
  }

  function runCmd(index: number) {
    const cmd = cmdRows[index];
    if (!cmd) return;
    closePalette();
    window.setTimeout(() => cmd.run(), 60);
  }

  useEffect(() => {
    presentingRef.current = presenting;
  }, [presenting]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (cmdOpen) closePalette();
        else openPalette();
        return;
      }
      if (e.key === "Escape") {
        if (cmdOpen) {
          closePalette();
          return;
        }
        if (presentingRef.current) {
          endPresentation();
          return;
        }
        if (cold) setCold(false);
        return;
      }
      if (cmdOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setCmdSel((i) => Math.min(i + 1, Math.max(0, cmdRows.length - 1)));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setCmdSel((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          runCmd(cmdSel);
        }
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (presentingRef.current && (e.key === "ArrowRight" || e.key === " ")) {
        e.preventDefault();
        step(1);
        return;
      }
      if (presentingRef.current && e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        return;
      }
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (presentingRef.current) endPresentation();
        else startPresentation();
        return;
      }
      if (e.key.toLowerCase() === "d" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => {
    clearTimers();
    document.documentElement.classList.remove("presenting");
  }, []);

  const spokes = COLD_STATES.flatMap((state, si) =>
    Array.from({ length: 3 }, (_, k) => {
      const i = si * 3 + k;
      const a = ((i * 15 - 90) * Math.PI) / 180;
      return { i, state, a };
    }),
  );

  return (
    <>
      <div
        id="cold"
        className={cold ? undefined : "gone"}
        onClick={(e) => {
          if (e.target === e.currentTarget) setCold(false);
        }}
      >
        <div className="cold-in">
          <div className="cold-ring" id="coldRing">
            <svg viewBox="0 0 132 132" width="132" height="132">
              <circle cx="66" cy="66" r="62" fill="none" stroke="var(--line)" strokeWidth="1" />
              {spokes.map((spoke) => (
                <line
                  key={spoke.i}
                  x1={(COLD_R + 34 * Math.cos(spoke.a)).toFixed(1)}
                  y1={(COLD_R + 34 * Math.sin(spoke.a)).toFixed(1)}
                  x2={(COLD_R + 58 * Math.cos(spoke.a)).toFixed(1)}
                  y2={(COLD_R + 58 * Math.sin(spoke.a)).toFixed(1)}
                  stroke={COLD_COLOUR[spoke.state]}
                  strokeWidth={spoke.state === "missing" ? 2 : 3}
                  strokeLinecap="round"
                  style={{ animationDelay: `${(0.25 + spoke.i * 0.035).toFixed(2)}s` }}
                />
              ))}
              <circle cx="66" cy="66" r="4.5" fill="var(--saffron-400)" />
            </svg>
          </div>
          <div className="cold-title">
            Every claim
            <br />
            has a <span className="mark-saffron">receipt</span>.
          </div>
          <div className="cold-sub">
            Deal Truth turns a sales call into notes you can defend line by line. Click any finding and hear the customer
            say it — or watch the evidence gate refuse to ship it.
          </div>
          <div className="cold-cta">
            <button type="button" className="btn primary" onClick={() => startPresentation()}>
              ▶&nbsp; Run the 90-second demo
            </button>
            <button type="button" className="btn" onClick={() => setCold(false)}>
              Explore it myself
            </button>
          </div>
          <div className="tiny" style={{ marginTop: 22, color: "var(--text-3)" }}>
            <span className="kbd">⌘K</span> jump anywhere · <span className="kbd">P</span> presentation mode ·{" "}
            <span className="kbd">D</span> dark mode
          </div>
        </div>
      </div>

      <div id="stage" className={presenting ? "on" : undefined}>
        <div className="stage-in">
          <div className="stage-card">
            <div className="stage-n">
              {String(beatIndex + 1).padStart(2, "0")} / {BEAT_COUNT}
            </div>
            <div className="stage-txt">
              <div className="stage-cap">{highlightBrand(beats[beatIndex]?.cap ?? "")}</div>
              <div className="stage-sub">{beats[beatIndex]?.sub}</div>
            </div>
            <div className="stage-ctl">
              <div className="dots">
                {beats.map((_, i) => (
                  <i key={i} className={i < beatIndex ? "done" : i === beatIndex ? "now" : undefined} />
                ))}
              </div>
              <button type="button" className="iconbtn" title="Previous" onClick={() => step(-1)}>
                ‹
              </button>
              <button
                type="button"
                className={auto ? "btn sm primary" : "btn sm"}
                onClick={() => {
                  const next = !autoRef.current;
                  autoRef.current = next;
                  setAuto(next);
                  if (next) later(() => step(1), 5200);
                  else clearTimers();
                }}
              >
                {auto ? "Auto ▸" : "Auto"}
              </button>
              <button type="button" className="btn primary sm" onClick={() => step(1)}>
                Next ›
              </button>
              <button type="button" className="iconbtn" title="Exit" onClick={endPresentation}>
                ✕
              </button>
            </div>
          </div>
          <div className="stage-bar">
            <i id="stageBar" style={{ width: `${((beatIndex + 1) / BEAT_COUNT) * 100}%` }} />
          </div>
        </div>
      </div>

      {cmdOpen ? <div className="scrim on" onClick={closePalette} aria-hidden /> : null}
      <div id="cmdk" className={cmdOpen ? "on" : undefined}>
        <input
          ref={cmdInputRef}
          id="cmdkInput"
          placeholder="Jump to a screen, a moment, or a claim…"
          value={cmdQuery}
          onChange={(e) => {
            setCmdQuery(e.target.value);
            setCmdSel(0);
          }}
        />
        <div className="cmd-list" id="cmdkList">
          {cmdRows.length === 0 ? (
            <div className="cmd-row" style={{ color: "var(--text-3)" }}>
              Nothing matches.
            </div>
          ) : (
            cmdRows.map((cmd, i) => (
              <button
                key={cmd.label}
                type="button"
                className={i === cmdSel ? "cmd-row sel" : "cmd-row"}
                onMouseEnter={() => setCmdSel(i)}
                onClick={() => runCmd(i)}
              >
                <span>{cmd.label}</span>
                {cmd.keys ? <span className="cmd-k">{cmd.keys}</span> : null}
              </button>
            ))
          )}
        </div>
      </div>

      <div className={toast ? "toast on" : "toast"}>{toast}</div>
    </>
  );
}
