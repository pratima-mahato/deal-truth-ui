import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { ActionSelect } from "./ActionSelect";
import {
  type ActionKind,
  ACTION_LABELS,
  loadIntegrationPrefs,
  saveIntegrationPrefs,
} from "./buildOperations";

const ACTIONS = Object.keys(ACTION_LABELS) as ActionKind[];

const DEFAULT_SELECTED: Record<ActionKind, boolean> = {
  deal: true,
  note: true,
  task: true,
  call: true,
  meeting: false,
};

export function HubSpotManageDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [initial, setInitial] = useState(DEFAULT_SELECTED);

  useEffect(() => {
    if (!open) return;
    const prefs = loadIntegrationPrefs();
    const next = { ...DEFAULT_SELECTED, ...prefs.selected };
    setSelected(next);
    setInitial(next);
  }, [open]);

  const dirty = ACTIONS.some((kind) => selected[kind] !== initial[kind]);

  function save() {
    saveIntegrationPrefs({ selected });
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      dirty={dirty}
      size="lg"
      eyebrow="Connected & Ready"
      title="HubSpot"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save actions</Button>
        </div>
      }
    >
      <p className="text-sm text-ink-500">
        Choose what DealTruth should send to your CRM. These preferences apply the next time you send intelligence from
        a call.
      </p>
      <div className="mt-5 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">CRM actions</p>
        {ACTIONS.map((kind) => (
          <ActionSelect
            key={kind}
            kind={kind}
            selected={selected[kind]}
            onToggle={() => setSelected((prev) => ({ ...prev, [kind]: !prev[kind] }))}
          />
        ))}
      </div>
    </Drawer>
  );
}
