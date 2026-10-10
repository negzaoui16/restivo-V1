"use client";

import { Eye, Plus, Upload } from "lucide-react";

export function MenuHeader({
  title,
  isPublished,
  isSaving,
  canAddItem,
  onAddItem,
  onPreview,
  onPublish,
}: {
  title: string;
  isPublished: boolean;
  isSaving: boolean;
  canAddItem: boolean;
  onAddItem: () => void;
  onPreview: () => void;
  onPublish: () => void;
}) {
  return (
    <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
          Menu
        </h1>
        <p className="text-xs sm:text-sm text-[#736D65] mt-1">
          Create, organize and manage everything your customers can order.
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isSaving ? "bg-amber-500" : isPublished ? "bg-emerald-500" : "bg-[#C5BFAD]"
            }`}
          />
          <span
            className={`text-xs font-medium ${
              isSaving
                ? "text-amber-700"
                : isPublished
                ? "text-emerald-700"
                : "text-[#736D65]"
            }`}
          >
            {isSaving ? "Saving…" : isPublished ? `${title} is published` : `${title} is a draft`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E8E2D7] text-[#1A1A1A] text-sm font-semibold hover:bg-[#FAF7F2] transition-colors shadow-sm"
        >
          <Eye className="w-4 h-4" />
          Preview menu
        </button>
        <button
          type="button"
          onClick={onAddItem}
          disabled={!canAddItem}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E8E2D7] text-[#1A1A1A] text-sm font-semibold hover:bg-[#FAF7F2] transition-colors shadow-sm disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          Add item
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isSaving || isPublished}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B55234] hover:bg-[#9E4328] text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {isPublished ? "Published" : "Publish menu"}
        </button>
      </div>
    </section>
  );
}
