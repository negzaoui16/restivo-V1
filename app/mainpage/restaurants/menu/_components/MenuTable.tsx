"use client";

import React, { useState } from "react";
import { Copy, Eye, EyeOff, MoreVertical, Pencil, Search, Trash2, Box, Sparkles, Star } from "lucide-react";
import type { PublicMenuItem } from "@/lib/menu/types";
import { parseDescriptionTags, getTagById } from "@/lib/menu/tags";
import { STATUS_STYLES } from "../_lib/menu-ui";
import { ARModal } from "./ARModal";

function ActionMenuItem({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
        destructive ? "text-red-600 hover:bg-red-50" : "text-[#1A1A1A] hover:bg-[#FAF7F2]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MenuItemRow({
  item,
  index,
  currency,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleAvailability,
  onToggleFeatured,
  onPreview3D,
  isActionOpen,
  onToggleAction,
}: {
  item: PublicMenuItem;
  index: number;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleAvailability: () => void;
  onToggleFeatured?: () => void;
  onPreview3D: () => void;
  isActionOpen: boolean;
  onToggleAction: () => void;
}) {
  const { text: cleanDescription, tags } = parseDescriptionTags(item.description);

  return (
    <div
      className="group grid grid-cols-[1fr_90px_120px_100px_90px] gap-3 px-4 py-3 items-center hover:bg-[#FAF7F2]/60 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-[#F5F0E8] ring-1 border-[#E8E2D7] relative">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover relative z-10"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center text-[#B55234] text-xs font-bold absolute inset-0">
            {item.name.slice(0, 1)}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-bold text-[#1A1A1A] truncate">{item.name}</p>
            {item.isFeatured && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>Chef&apos;s pick</span>
              </span>
            )}
            {item.model3dUrl && (
              <button
                type="button"
                onClick={onPreview3D}
                title="Cliquer pour prévisualiser en 3D / AR"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold shrink-0 hover:bg-purple-100 transition-colors shadow-2xs"
              >
                <Box className="w-3 h-3" />
                <span>3D / AR</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] font-medium text-[#A39C91] truncate">{item.categoryName}</p>
            {cleanDescription && (
              <p className="text-[11px] text-[#C5BFAD] truncate hidden sm:block">· {cleanDescription}</p>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tagId) => {
                const tag = getTagById(tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${tag.colorClass}`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="text-right text-sm font-bold text-[#1A1A1A] whitespace-nowrap">
        {item.price} {currency}
      </div>

      {/* 1-Click Availability Toggle */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onToggleAvailability}
          title={item.isAvailable ? "Cliquer pour marquer comme Épuisé" : "Cliquer pour marquer comme Disponible"}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
            item.isAvailable
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
          <span>{item.isAvailable ? "Disponible" : "Épuisé"}</span>
        </button>
      </div>

      <div className="flex items-center justify-center">
        {item.promotionLabel ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF0EA] text-[#B55234] text-xs font-bold">
            {item.promotionLabel}
          </span>
        ) : (
          <span className="text-xs text-[#C5BFAD]">—</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 relative">
        {onToggleFeatured && (
          <button
            type="button"
            onClick={onToggleFeatured}
            aria-label={item.isFeatured ? `Retirer ${item.name} de la sélection Chef` : `Mettre ${item.name} en vedette`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              item.isFeatured
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "hover:bg-[#E8E2D7] text-[#A39C91] hover:text-amber-600"
            }`}
            title={item.isFeatured ? "Retirer de la sélection Chef" : "Mettre en vedette (Chef's Pick)"}
          >
            <Star className={`w-3.5 h-3.5 ${item.isFeatured ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Modifier ${item.name}`}
          className="w-7 h-7 rounded-lg hover:bg-[#E8E2D7] flex items-center justify-center text-[#736D65] transition-colors"
          title="Modifier"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleAction}
          aria-label={`Plus d'actions pour ${item.name}`}
          aria-expanded={isActionOpen}
          className="w-7 h-7 rounded-lg hover:bg-[#E8E2D7] flex items-center justify-center text-[#736D65] transition-colors"
          title="Plus d'actions"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {isActionOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E8E2D7] rounded-xl shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
            {item.model3dUrl && (
              <ActionMenuItem
                icon={<Box className="w-3.5 h-3.5 text-purple-600" />}
                label="Voir en 3D / AR"
                onClick={onPreview3D}
              />
            )}
            <ActionMenuItem icon={<Pencil className="w-3.5 h-3.5" />} label="Modifier" onClick={onEdit} />
            <ActionMenuItem icon={<Copy className="w-3.5 h-3.5" />} label="Dupliquer" onClick={onDuplicate} />
            <ActionMenuItem
              icon={item.isAvailable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              label={item.isAvailable ? "Rendre indisponible" : "Rendre disponible"}
              onClick={onToggleAvailability}
            />
            <div className="my-1 border-t border-[#F0ECE4]" />
            <ActionMenuItem
              icon={<Trash2 className="w-3.5 h-3.5" />}
              label="Supprimer"
              onClick={onDelete}
              destructive
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function MenuTable({
  items,
  currency,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleAvailability,
  onToggleFeatured,
  actionMenuId,
  setActionMenuId,
}: {
  items: PublicMenuItem[];
  currency: string;
  onEdit: (item: PublicMenuItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: PublicMenuItem) => void;
  onToggleAvailability: (id: string) => void;
  onToggleFeatured?: (id: string) => void;
  actionMenuId: string | null;
  setActionMenuId: (id: string | null) => void;
}) {
  const [previewItem, setPreviewItem] = useState<PublicMenuItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F5F0E8] flex items-center justify-center mb-3">
          <Search className="w-6 h-6 text-[#A39C91]" />
        </div>
        <p className="text-sm font-semibold text-[#1A1A1A]">Aucun article</p>
        <p className="text-xs text-[#A39C91] mt-1">Ajoutez une catégorie, puis ajoutez votre premier plat.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-[#E8E2D7] rounded-xl bg-white shadow-xs overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_90px_120px_100px_90px] gap-3 px-4 py-2.5 bg-[#FAF7F2] border-b border-[#E8E2D7] rounded-t-xl text-xs font-bold text-[#A39C91] uppercase tracking-wider">
            <span>Article</span>
            <span className="text-right">Prix</span>
            <span className="text-center">Disponibilité</span>
            <span className="text-center">Promotion</span>
            <span className="text-center">Actions</span>
          </div>
          <div className="divide-y divide-[#F0ECE4]">
            {items.map((item, index) => (
              <MenuItemRow
                key={item.id}
                item={item}
                index={index}
                currency={currency}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.id)}
                onDuplicate={() => onDuplicate(item)}
                onToggleAvailability={() => onToggleAvailability(item.id)}
                onToggleFeatured={onToggleFeatured ? () => onToggleFeatured(item.id) : undefined}
                onPreview3D={() => setPreviewItem(item)}
                isActionOpen={actionMenuId === item.id}
                onToggleAction={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {previewItem && previewItem.model3dUrl && (
        <ARModal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          itemName={previewItem.name}
          modelUrl={previewItem.model3dUrl}
          imageUrl={previewItem.imageUrl}
        />
      )}
    </>
  );
}
