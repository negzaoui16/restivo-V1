"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { RestivoGlyph } from "@/app/mainpage/_components/RestivoGlyph";
import type { ManagedRestaurant } from "../../_context/RestaurantManagerContext";
import type { PublicMenu } from "@/lib/menu/types";
import { previewCategories } from "../_lib/preview";
import { MenuPreviewIdentity } from "./MenuPreviewIdentity";
import { MenuPreviewSection } from "./MenuPreviewSection";

const PATTERN = "/VisualIdentity/macroPattern.png";

export function MenuPreview({
  restaurant,
  menu,
  currency,
  onClose,
}: {
  restaurant: ManagedRestaurant;
  menu: PublicMenu;
  currency: string;
  onClose: () => void;
}) {
  const categories = previewCategories(menu);
  const livePromotions = menu.promotions.filter((promotion) => promotion.isLive);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function scrollToCategory(id: string) {
    document.getElementById(`preview-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className="fixed inset-0 z-[80] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-preview-title"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#FAF7F2",
          backgroundImage: `url('${PATTERN}')`,
          backgroundRepeat: "repeat",
          backgroundSize: "720px auto",
        }}
      />
      <div className="absolute inset-0 bg-[#FAF7F2]/35 pointer-events-none" />

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 border border-[#E8E2D7] text-xs font-semibold text-[#1A1A1A] shadow-sm hover:bg-white"
      >
        <X className="w-4 h-4" />
        Close
      </button>

      <div className="relative h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6 py-10 sm:py-14">
            <article className="rounded-[28px] bg-[#FAF7F2]/80 backdrop-blur-[2px] border border-[#E8E2D7]/80 shadow-[0_24px_80px_-32px_rgba(50,36,24,0.35)] px-5 sm:px-10 py-10 sm:py-12">
            <div id="menu-preview-title" className="sr-only">
              {restaurant.name} menu preview
            </div>
            <MenuPreviewIdentity
              restaurant={restaurant}
              menuName={menu.name}
              menuDescription={menu.description}
              isPublished={menu.isPublished}
            />

            {livePromotions.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {livePromotions.map((promotion) => (
                  <span
                    key={promotion.id}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-[#B55234] text-white text-[11px] font-bold tracking-wide"
                  >
                    {promotion.name}
                    {promotion.type === "PERCENTAGE"
                      ? ` · ${promotion.value}% off`
                      : ` · ${promotion.value} ${currency} off`}
                  </span>
                ))}
              </div>
            )}

            {categories.length > 1 && (
              <nav
                className="sticky top-0 z-[1] -mx-2 mt-8 mb-6 px-2 py-2 bg-[#FAF7F2]/90 backdrop-blur-sm border-b border-[#E8E2D7]/70"
                aria-label="Menu categories"
              >
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => scrollToCategory(category.id)}
                      className="shrink-0 px-3 py-1.5 rounded-full border border-[#E0D8CC] bg-white/70 text-xs font-semibold text-[#4A443D] hover:border-[#B55234] hover:text-[#B55234]"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </nav>
            )}

            {categories.length === 0 ? (
              <p className="mt-10 text-center text-sm text-[#736D65]">
                This menu has no dishes yet. Add a category and items to see them here.
              </p>
            ) : (
              <div className="mt-8 flex flex-col gap-10">
                {categories.map((category) => (
                  <MenuPreviewSection
                    key={category.id}
                    category={category}
                    currency={currency}
                  />
                ))}
              </div>
            )}

            <footer className="mt-12 pt-6 border-t border-[#E8E2D7] text-center">
              <div className="flex items-center justify-center gap-2 text-[#B55234]">
                <RestivoGlyph className="w-4 h-4" color="#B55234" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em]">Restivo</span>
              </div>
              <p className="mt-2 text-[11px] text-[#8A847C]">Good food brings people together</p>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
