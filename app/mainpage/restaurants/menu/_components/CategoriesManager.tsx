"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { PublicMenuCategory } from "@/lib/menu/types";

export function CategoriesManager({
  categories,
  disabled,
  onRename,
  onDelete,
}: {
  categories: PublicMenuCategory[];
  disabled?: boolean;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-[#736D65] py-10 text-center">
        No categories yet. Add one from the Items tab.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-xl">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center gap-3 bg-white border border-[#E8E2D7] rounded-xl px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#1A1A1A] truncate">{category.name}</p>
            <p className="text-xs text-[#A39C91]">{category.itemCount} items</p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const next = window.prompt("Rename category", category.name);
              if (next && next.trim() && next.trim() !== category.name) {
                onRename(category.id, next.trim());
              }
            }}
            className="w-8 h-8 rounded-lg hover:bg-[#F5F0E8] flex items-center justify-center text-[#736D65]"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (
                window.confirm(
                  `Delete “${category.name}”? Items in this category will be removed too.`
                )
              ) {
                onDelete(category.id);
              }
            }}
            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
