"use client";

import React, { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { PublicMenuCategory, PublicMenuItem } from "@/lib/menu/types";
import { FORM_INPUT_CLASS } from "../_lib/menu-ui";

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#A39C91] uppercase tracking-wider mb-1.5 block">
        {label}
        {required && <span className="text-[#B55234] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
        checked ? "bg-[#B55234]" : "bg-[#D4CFC6]"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function AddMenuItemPanel({
  editingItem,
  categories,
  currency,
  saving,
  onSave,
  onClose,
}: {
  editingItem: PublicMenuItem | null;
  categories: PublicMenuCategory[];
  currency: string;
  saving?: boolean;
  onSave: (input: {
    categoryId: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price: number;
    isAvailable: boolean;
    isFeatured: boolean;
  }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editingItem?.name ?? "");
  const [categoryId, setCategoryId] = useState(editingItem?.categoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(editingItem?.description ?? "");
  const [price, setPrice] = useState(editingItem?.price?.toString() ?? "");
  const [isAvailable, setIsAvailable] = useState(editingItem?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(editingItem?.isFeatured ?? false);
  const [imageUrl, setImageUrl] = useState(editingItem?.imageUrl ?? "");

  return (
    <div className="lg:w-[320px] xl:w-[340px] shrink-0 border-l border-[#E8E2D7] bg-white ml-0 lg:ml-4 mt-4 lg:mt-0 rounded-xl lg:rounded-none lg:rounded-r-xl p-5 animate-in slide-in-from-right-4 duration-300 overflow-y-auto max-h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-[#1A1A1A]">
          {editingItem ? "Edit menu item" : "Add menu item"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-[#F5F0E8] flex items-center justify-center text-[#A39C91] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <FormField label="Item name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Truffle Pasta"
            className={FORM_INPUT_CLASS}
          />
        </FormField>

        <FormField label="Category" required>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`${FORM_INPUT_CLASS} appearance-none pr-8 cursor-pointer`}
            >
              <option value="">Select category</option>
              {categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39C91] pointer-events-none" />
          </div>
        </FormField>

        <FormField label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ingredients and special details..."
            rows={3}
            className={`${FORM_INPUT_CLASS} resize-none`}
          />
        </FormField>

        <FormField label="Image URL">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            className={FORM_INPUT_CLASS}
          />
        </FormField>

        <FormField label="Price" required>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`${FORM_INPUT_CLASS} pr-14`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A39C91]">
              {currency}
            </span>
          </div>
        </FormField>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#A39C91]" />
            <span className="text-sm font-medium text-[#1A1A1A]">Available</span>
          </div>
          <ToggleSwitch checked={isAvailable} onChange={setIsAvailable} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#1A1A1A]">Featured</span>
          <ToggleSwitch checked={isFeatured} onChange={setIsFeatured} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <button
          type="button"
          onClick={() =>
            onSave({
              categoryId,
              name: name.trim(),
              description: description.trim() || undefined,
              imageUrl: imageUrl.trim() || undefined,
              price: parseFloat(price) || 0,
              isAvailable,
              isFeatured,
            })
          }
          disabled={saving || !name.trim() || !categoryId || !price}
          className="w-full py-2.5 rounded-xl bg-[#B55234] hover:bg-[#9E4328] disabled:bg-[#D4CFC6] disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
        >
          {saving ? "Saving…" : editingItem ? "Update item" : "Save item"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E2D7] text-[#1A1A1A] text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
