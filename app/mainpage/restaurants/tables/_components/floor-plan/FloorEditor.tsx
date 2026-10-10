"use client";

import type { FloorObject } from "./floor-object";
import { FloorEditorProvider } from "./editor/context";
import { useFloorEditor } from "./editor/use-floor-editor";
import { FloorCanvas } from "./FloorCanvas";
import { FloorToolbar } from "./FloorToolbar";
import { ObjectLibrary } from "./ObjectLibrary";
import { PropertiesPanel } from "./PropertiesPanel";

export function FloorEditor({
  width,
  height,
  objects,
  onSave,
  onPublish,
}: {
  width: number;
  height: number;
  objects: FloorObject[];
  onSave: (objects: FloorObject[]) => Promise<void>;
  onPublish: (objects: FloorObject[]) => Promise<void>;
}) {
  const editor = useFloorEditor({ width, height, initialObjects: objects, onSave, onPublish });

  return (
    <FloorEditorProvider value={editor}>
      <section className="flex h-full min-w-0 flex-1 flex-col gap-3">
        <FloorToolbar />
        <div className="flex min-h-0 flex-1 gap-3">
          <ObjectLibrary />
          <FloorCanvas />
          <PropertiesPanel />
        </div>
      </section>
    </FloorEditorProvider>
  );
}
