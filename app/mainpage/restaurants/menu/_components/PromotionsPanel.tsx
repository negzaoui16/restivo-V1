"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import type { PublicMenu, PublicPromotion } from "@/lib/menu/types";
import { FORM_INPUT_CLASS } from "../_lib/menu-ui";

function defaultRange() {
  const start = new Date();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const toInput = (date: Date) => date.toISOString().slice(0, 16);
  return { startsAt: toInput(start), endsAt: toInput(end) };
}

export function PromotionsPanel({
  menu,
  currency,
  disabled,
  onCreate,
  onDelete,
}: {
  menu: PublicMenu;
  currency: string;
  disabled?: boolean;
  onCreate: (input: {
    name: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    startsAt: string;
    endsAt: string;
    menuItemIds: string[];
  }) => void;
  onDelete: (id: string) => void;
}) {
  const items = useMemo(() => menu.categories.flatMap((category) => category.items), [menu]);
  const range = defaultRange();
  const [name, setName] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [value, setValue] = useState("10");
  const [startsAt, setStartsAt] = useState(range.startsAt);
  const [endsAt, setEndsAt] = useState(range.endsAt);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <div className="flex flex-col gap-2">
        {menu.promotions.length === 0 && (
          <p className="text-sm text-[#736D65] py-8 text-center">No promotions yet.</p>
        )}
        {menu.promotions.map((promotion) => (
          <PromotionCard
            key={promotion.id}
            promotion={promotion}
            currency={currency}
            disabled={disabled}
            onDelete={() => onDelete(promotion.id)}
          />
        ))}
      </div>

      <form
        className="bg-white border border-[#E8E2D7] rounded-2xl p-4 flex flex-col gap-3 h-fit"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onCreate({
            name: name.trim(),
            type,
            value: Number(value),
            startsAt,
            endsAt,
            menuItemIds: selectedIds,
          });
          setName("");
          setSelectedIds([]);
        }}
      >
        <h3 className="text-sm font-bold text-[#1A1A1A]">New promotion</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lunch special"
          className={FORM_INPUT_CLASS}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
            className={FORM_INPUT_CLASS}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Fixed amount</option>
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={FORM_INPUT_CLASS}
          />
        </div>
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={FORM_INPUT_CLASS} />
        <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={FORM_INPUT_CLASS} />
        <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-xs text-[#1A1A1A]">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={(event) => {
                  setSelectedIds((prev) =>
                    event.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id)
                  );
                }}
              />
              {item.name}
            </label>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-[#A39C91]">Add menu items first to attach a promotion.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !name.trim()}
          className="py-2.5 rounded-xl bg-[#B55234] text-white text-sm font-bold disabled:opacity-50"
        >
          Create promotion
        </button>
      </form>
    </div>
  );
}

function PromotionCard({
  promotion,
  currency,
  disabled,
  onDelete,
}: {
  promotion: PublicPromotion;
  currency: string;
  disabled?: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border border-[#E8E2D7] rounded-xl px-4 py-3 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-[#1A1A1A]">{promotion.name}</p>
        <p className="text-xs text-[#736D65] mt-0.5">
          {promotion.type === "PERCENTAGE"
            ? `${promotion.value}% off`
            : `${promotion.value} ${currency} off`}
          {" · "}
          {promotion.menuItemIds.length} items
          {promotion.isLive ? " · live" : promotion.isActive ? " · scheduled" : " · paused"}
        </p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
