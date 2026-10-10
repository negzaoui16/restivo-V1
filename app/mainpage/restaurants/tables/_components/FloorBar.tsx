"use client";

import { Copy, Edit2, LayoutGrid, Plus, Trash2, Users } from "lucide-react";

const ACTION_CLASS =
  "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E5DFD3] hover:bg-[#F5F2EC] text-[13px] font-semibold text-[#1A1A1A] transition-colors disabled:opacity-40";

export function FloorBar({
  floors,
  activeId,
  tableCount,
  seatCount,
  onSelect,
  onAdd,
  onEdit,
  onDuplicate,
  onDelete,
  onReorder,
}: {
  floors: { id: string; name: string }[];
  activeId: string | null;
  tableCount: number;
  seatCount: number;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: () => void;
}) {
  const hasFloor = Boolean(activeId);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[15px] font-semibold">Floors</span>
          {floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              onClick={() => onSelect(floor.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeId === floor.id
                  ? "bg-[#B8573A] text-white shadow-sm"
                  : "border border-[#E5DFD3] bg-white text-[#6B665E] hover:bg-[#F5F2EC]"
              }`}
            >
              {floor.name}
            </button>
          ))}
          <button
            type="button"
            onClick={onAdd}
            className="ml-1 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-[#6B665E] hover:bg-[#F5F2EC]"
          >
            <Plus className="h-4 w-4" />
            Add floor
          </button>
        </div>
        <div className="flex items-center gap-6 text-[13px] font-medium text-[#6B665E]">
          <span className="flex items-center gap-1.5">
            <LayoutGrid className="h-4 w-4" />
            {tableCount} tables
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {seatCount} seats
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button type="button" className={ACTION_CLASS} disabled={!hasFloor} onClick={onEdit}>
          <Edit2 className="h-3.5 w-3.5 text-[#6B665E]" />
          Edit floor
        </button>
        <button type="button" className={ACTION_CLASS} disabled={!hasFloor} onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5 text-[#6B665E]" />
          Duplicate
        </button>
        <button type="button" className={ACTION_CLASS} disabled={!hasFloor} onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-[#6B665E]" />
          Delete
        </button>
        <button type="button" className={`${ACTION_CLASS} ml-2`} disabled={floors.length < 2} onClick={onReorder}>
          Reorder
        </button>
      </div>
    </>
  );
}
