import { useState, type KeyboardEvent } from "react";
import { parseTagList } from "./constants";

export function TagInput({
  id,
  values,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const incoming = parseTagList(raw);
    if (!incoming.length) return;
    const seen = new Set(values.map((value) => value.toLowerCase()));
    const next = [...values];
    for (const item of incoming) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      next.push(item);
    }
    onChange(next);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="tag-input">
      {values.map((value) => (
        <span key={value} className="chip brand">
          {value}
          <button
            type="button"
            className="tag-remove"
            aria-label={`Remove ${value}`}
            disabled={disabled}
            onClick={() => onChange(values.filter((item) => item !== value))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        disabled={disabled}
        placeholder={values.length ? "Add another" : placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
      />
    </div>
  );
}
