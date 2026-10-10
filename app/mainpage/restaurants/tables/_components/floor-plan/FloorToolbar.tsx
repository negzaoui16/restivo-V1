"use client";

import type { ReactNode } from "react";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { useFloorEditorContext } from "./editor/context";

export function FloorToolbar() {
  const editor = useFloorEditorContext();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E5DFD3] bg-white px-2 py-1.5">
      <IconButton label="Undo" disabled={!editor.canUndo} onClick={editor.undo}>
        <Undo2 className="h-4 w-4" />
      </IconButton>
      <IconButton label="Redo" disabled={!editor.canRedo} onClick={editor.redo}>
        <Redo2 className="h-4 w-4" />
      </IconButton>
      <span className="mx-1 h-6 w-px bg-[#E5DFD3]" />
      <IconButton label="Zoom out" onClick={() => editor.zoomBy(-1)}>
        <Minus className="h-4 w-4" />
      </IconButton>
      <button type="button" onClick={() => editor.zoomBy(0)} className="min-w-12 text-[13px] font-semibold">
        {Math.round(editor.zoom * 100)}%
      </button>
      <IconButton label="Zoom in" onClick={() => editor.zoomBy(1)}>
        <Plus className="h-4 w-4" />
      </IconButton>
      <span className="mx-1 h-6 w-px bg-[#E5DFD3]" />
      <Toggle label="Grid" pressed={editor.showGrid} onClick={editor.toggleGrid} />
      <Toggle label="Snap" pressed={editor.snap} onClick={editor.toggleSnap} />
      <span className="mx-1 h-6 w-px bg-[#E5DFD3]" />
      <Toggle label="Preview" pressed={editor.preview} onClick={editor.togglePreview} />
      <TextButton disabled={editor.saving} onClick={editor.save}>
        Save
      </TextButton>
      <button
        type="button"
        disabled={editor.saving}
        onClick={editor.publish}
        className="rounded-lg bg-[#B55234] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#9E4328] disabled:opacity-50"
      >
        Publish
      </button>
      {editor.notice ? (
        <span className={`text-[13px] font-semibold ${editor.notice === "Saved" || editor.notice === "Published" ? "text-[#6B665E]" : "text-[#B55234]"}`}>
          {editor.notice}
        </span>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg text-[#3A3530] hover:bg-[#F5F2EC] disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Toggle({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-[13px] font-semibold ${
        pressed ? "bg-[#FAF0EA] text-[#B55234]" : "text-[#6B665E] hover:bg-[#F5F2EC]"
      }`}
    >
      {label}
      {pressed ? " ✓" : ""}
    </button>
  );
}

function TextButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#3A3530] hover:bg-[#F5F2EC] disabled:opacity-50">
      {children}
    </button>
  );
}
