'use client';

import { useState } from 'react';

type JsonPayloadConsoleProps = {
  title?: string;
  sampleJson: string;
  jsonText: string;
  setJsonText: (value: string) => void;
  onExecute: () => Promise<void> | void;
  onExecuteBulk?: () => Promise<void> | void;
  onFillFromForm?: () => void;
  helperText?: string;
  presets?: Array<{ label: string; value: string }>;
};

export function JsonPayloadConsole({
  title = 'JSON Payload',
  sampleJson,
  jsonText,
  setJsonText,
  onExecute,
  onExecuteBulk,
  onFillFromForm,
  helperText = 'Format object tunggal untuk add/edit. Array JSON bisa dipakai untuk bulk execute.',
  presets = [],
}: JsonPayloadConsoleProps) {
  const [busy, setBusy] = useState(false);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText || sampleJson);
    } catch {
      // ignore clipboard failures
    }
  };

  const pasteJson = async () => {
    const text = await navigator.clipboard.readText();
    if (text) setJsonText(text);
  };

  const run = async (mode: 'single' | 'bulk') => {
    setBusy(true);
    try {
      if (mode === 'bulk' && onExecuteBulk) {
        await onExecuteBulk();
        return;
      }
      await onExecute();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hidden xl:block rounded-2xl border bg-zinc-50 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">{title}</div>
          <p className="text-[11px] text-zinc-500">{helperText}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="rounded-lg border bg-white px-2.5 py-1 text-[10px] font-semibold hover:bg-zinc-50"
              onClick={() => setJsonText(preset.value)}
            >
              {preset.label}
            </button>
          ))}
          {onFillFromForm ? (
            <button type="button" className="rounded-lg border bg-white px-2.5 py-1 text-[10px] font-semibold hover:bg-zinc-50" onClick={onFillFromForm}>
              Dari Form
            </button>
          ) : null}
          <button type="button" className="rounded-lg border bg-white px-2.5 py-1 text-[10px] font-semibold hover:bg-zinc-50" onClick={() => setJsonText(sampleJson)}>
            Sample
          </button>
          <button type="button" className="rounded-lg border bg-white px-2.5 py-1 text-[10px] font-semibold hover:bg-zinc-50" onClick={() => void pasteJson()}>
            Paste
          </button>
          <button type="button" className="rounded-lg border bg-white px-2.5 py-1 text-[10px] font-semibold hover:bg-zinc-50" onClick={() => void copyJson()}>
            Copy
          </button>
        </div>
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        spellCheck={false}
        className="min-h-72 w-full rounded-xl border bg-white px-3 py-2 font-mono text-[11px] leading-relaxed"
        placeholder={sampleJson}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run('single')}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Executing...' : 'Execute'}
        </button>
        {onExecuteBulk ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run('bulk')}
            className="rounded-xl border px-3 py-2 text-[11px] font-semibold disabled:opacity-60"
          >
            {busy ? 'Executing...' : 'Execute Bulk'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
