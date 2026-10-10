"use client";

import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { PublicMenuCategory } from "@/lib/menu/types";

export function CategoriesManager({
  categories,
  disabled,
  onRename,
  onDelete,
  onReorder,
}: {
  categories: PublicMenuCategory[];
  disabled?: boolean;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (currentId: string, targetId: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-[#736D65] py-10 text-center">
        No categories yet. Add one from the Items tab.
      </p>
    );
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!onReorder) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[index];
    const target = categories[targetIndex];
    if (current && target) {
      onReorder(current.id, target.id);
    }
  };

  return (
    <div className="flex flex-col gap-2 max-w-xl">
      <div className="flex items-center justify-between pb-1 text-xs text-[#736D65]">
        <span>Organisez l&apos;ordre d&apos;apparition de vos catégories sur le menu client</span>
        <span className="font-semibold">{categories.length} catégories</span>
      </div>
      {categories.map((category, index) => (
        <div
          key={category.id}
          className="flex items-center gap-2.5 bg-white border border-[#E8E2D7] rounded-xl px-4 py-3 shadow-2xs hover:border-[#D4CFC6] transition-all"
        >
          {/* Order number & Move buttons */}
          <div className="flex items-center gap-1">
            <span className="w-5 text-center text-xs font-bold text-[#A39C91]">
              #{index + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                disabled={disabled || index === 0}
                onClick={() => handleMove(index, "up")}
                className="w-5 h-5 rounded flex items-center justify-center text-[#736D65] hover:bg-[#F5F0E8] hover:text-[#B55234] disabled:opacity-30 disabled:hover:bg-transparent"
                title="Monter"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || index === categories.length - 1}
                onClick={() => handleMove(index, "down")}
                className="w-5 h-5 rounded flex items-center justify-center text-[#736D65] hover:bg-[#F5F0E8] hover:text-[#B55234] disabled:opacity-30 disabled:hover:bg-transparent"
                title="Descendre"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="min-w-0 flex-1 pl-1">
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
            className="w-8 h-8 rounded-lg hover:bg-[#F5F0E8] flex items-center justify-center text-[#736D65] transition-colors"
            title="Modifier"
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
            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
