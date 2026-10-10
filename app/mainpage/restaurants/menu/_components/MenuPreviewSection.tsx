"use client";

import type { PublicMenuCategory, PublicMenuItem } from "@/lib/menu/types";
import { formatMenuPrice } from "../_lib/preview";

function MenuPreviewItem({
  item,
  currency,
}: {
  item: PublicMenuItem;
  currency: string;
}) {
  const unavailable = !item.isAvailable;

  return (
    <article
      className={`grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3.5 border-b border-[#EDE7DC] last:border-0 ${
        unavailable ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex gap-3">
        {item.imageUrl && (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E8E2D7] bg-[#F3EEE6]">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#1A1A1A] tracking-tight">
              {item.name}
            </h3>
            {item.isFeatured && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#B55234] bg-[#FAF0EA] px-1.5 py-0.5 rounded-md">
                Chef's pick
              </span>
            )}
            {item.promotionLabel && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-[#B55234] px-1.5 py-0.5 rounded-md">
                {item.promotionLabel}
              </span>
            )}
          </div>
          {item.description && (
            <p className="mt-0.5 text-[13px] leading-snug text-[#736D65]">{item.description}</p>
          )}
          {unavailable && (
            <p className="mt-1 text-[11px] font-semibold text-[#9E4328]">Currently unavailable</p>
          )}
        </div>
      </div>
      <p className="text-sm font-bold text-[#1A1A1A] whitespace-nowrap pt-0.5">
        {formatMenuPrice(item.price, currency)}
      </p>
    </article>
  );
}

export function MenuPreviewSection({
  category,
  currency,
}: {
  category: PublicMenuCategory;
  currency: string;
}) {
  return (
    <section id={`preview-${category.id}`} className="scroll-mt-24">
      <div className="flex items-end justify-between gap-3 mb-1">
        <h2 className="text-lg font-extrabold text-[#1A1A1A] tracking-tight">{category.name}</h2>
        <div className="flex-1 h-px bg-[#E8E2D7] mb-1.5" />
      </div>
      {category.description && (
        <p className="text-xs text-[#7A746B] mb-1">{category.description}</p>
      )}
      <div>
        {category.items.map((item) => (
          <MenuPreviewItem key={item.id} item={item} currency={currency} />
        ))}
      </div>
    </section>
  );
}
