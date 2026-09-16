'use client';

import { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

function runCommand(cmd: string, value?: string) {
  if (typeof document === 'undefined') return;
  document.execCommand(cmd, false, value);
}

export function SimpleWysiwyg({ value, onChange, placeholder = 'Tulis konten...', minHeight = 220 }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-zinc-50">
        <button type="button" onClick={() => runCommand('bold')} className="px-2 py-1 text-xs border rounded">B</button>
        <button type="button" onClick={() => runCommand('italic')} className="px-2 py-1 text-xs border rounded italic">I</button>
        <button type="button" onClick={() => runCommand('underline')} className="px-2 py-1 text-xs border rounded underline">U</button>
        <button type="button" onClick={() => runCommand('insertUnorderedList')} className="px-2 py-1 text-xs border rounded">• List</button>
        <button type="button" onClick={() => runCommand('insertOrderedList')} className="px-2 py-1 text-xs border rounded">1. List</button>
        <button
          type="button"
          onClick={() => {
            const href = window.prompt('Masukkan URL link:');
            if (!href) return;
            runCommand('createLink', href);
          }}
          className="px-2 py-1 text-xs border rounded"
        >
          Link
        </button>
        <button type="button" onClick={() => runCommand('removeFormat')} className="px-2 py-1 text-xs border rounded">Clear</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        className="p-3 text-sm leading-relaxed outline-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
      <style jsx>{`
        div[contenteditable='true']:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

