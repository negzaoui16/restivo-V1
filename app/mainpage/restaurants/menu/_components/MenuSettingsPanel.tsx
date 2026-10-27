"use client";

import { useState } from "react";
import { Check, Palette, LayoutGrid, List, Image as ImageIcon } from "lucide-react";
import type { PublicMenu } from "@/lib/menu/types";
import { MENU_THEMES, parseMenuCustomization, formatMenuCustomization } from "@/lib/menu/theme";
import { FORM_INPUT_CLASS } from "../_lib/menu-ui";

export function MenuSettingsPanel({
  menu,
  disabled,
  onSave,
}: {
  menu: PublicMenu;
  disabled?: boolean;
  onSave: (input: { name: string; description?: string; isPublished: boolean }) => void;
}) {
  const custom = parseMenuCustomization(menu.description);
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(custom.description);
  const [isPublished, setIsPublished] = useState(menu.isPublished);
  const [selectedThemeId, setSelectedThemeId] = useState(custom.theme.id);
  const [viewMode, setViewMode] = useState<"grid" | "list">(custom.viewMode);
  const [bannerUrl, setBannerUrl] = useState(custom.bannerUrl ?? "");

  const activeTheme = MENU_THEMES.find((t) => t.id === selectedThemeId) ?? MENU_THEMES[0];

  return (
    <form
      className="max-w-xl flex flex-col gap-5 bg-white border border-[#E8E2D7] rounded-2xl p-6 shadow-xs"
      onSubmit={(event) => {
        event.preventDefault();
        const finalDescription = formatMenuCustomization(description.trim(), {
          themeId: selectedThemeId,
          viewMode,
          bannerUrl: bannerUrl.trim() || undefined,
        });
        onSave({
          name: name.trim(),
          description: finalDescription,
          isPublished,
        });
      }}
    >
      <div>
        <h2 className="text-base font-bold text-[#1A1A1A]">Paramètres & Personnalisation du Menu</h2>
        <p className="text-xs text-[#736D65] mt-0.5">
          Personnalisez la charte visuelle, les couleurs et le mode d&apos;affichage pour vos clients.
        </p>
      </div>

      <div>
        <label htmlFor="menu-settings-name" className="text-[11px] font-semibold text-[#A39C91] uppercase tracking-wider mb-1.5 block">
          Nom du Menu
        </label>
        <input id="menu-settings-name" value={name} onChange={(e) => setName(e.target.value)} className={FORM_INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="menu-settings-description" className="text-[11px] font-semibold text-[#A39C91] uppercase tracking-wider mb-1.5 block">
          Description ou Message d&apos;accueil
        </label>
        <textarea
          id="menu-settings-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Ex: Une sélection d'ingrédients frais et de spécialités maison..."
          className={`${FORM_INPUT_CLASS} resize-none`}
        />
      </div>

      {/* Visual Theme & Accent Colors */}
      <div>
        <label className="text-[11px] font-semibold text-[#A39C91] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#B55234]" />
          <span>Thème & Couleur d&apos;accentuation</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MENU_THEMES.map((theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-[#1A1A1A] bg-[#FAF7F2] shadow-2xs ring-1 ring-[#1A1A1A]"
                    : "border-[#E8E2D7] bg-white hover:border-[#D4CFC6]"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1A1A] truncate">{theme.name}</p>
                  <p className="text-[10px] text-[#A39C91] font-mono">{theme.primaryColor}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display Mode (Grid vs List) */}
      <div>
        <label className="text-[11px] font-semibold text-[#A39C91] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-[#B55234]" />
          <span>Mode d&apos;affichage client par défaut</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
              viewMode === "grid"
                ? "border-[#B55234] bg-[#FAF0EA]/60 text-[#B55234] font-bold shadow-2xs"
                : "border-[#E8E2D7] bg-white text-[#736D65] hover:border-[#D4CFC6]"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-xs">Vue Grille & 3D</span>
            <span className="text-[10px] opacity-75">Grandes photos & boutons 3D/AR</span>
          </button>

          <button
            type="button"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
              viewMode === "list"
                ? "border-[#B55234] bg-[#FAF0EA]/60 text-[#B55234] font-bold shadow-2xs"
                : "border-[#E8E2D7] bg-white text-[#736D65] hover:border-[#D4CFC6]"
            }`}
          >
            <List className="w-5 h-5" />
            <span className="text-xs">Vue Liste Compacte</span>
            <span className="text-[10px] opacity-75">Format carte bistrot traditionnel</span>
          </button>
        </div>
      </div>

      {/* Banner / Cover URL */}
      <div>
        <label htmlFor="menu-settings-banner" className="text-[11px] font-semibold text-[#A39C91] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#B55234]" />
          <span>Photo de couverture / Bannière du Menu</span>
        </label>
        <input
          id="menu-settings-banner"
          type="url"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://... ou /images/... (optionnel)"
          className={FORM_INPUT_CLASS}
        />
        {bannerUrl && (
          <div className="mt-2 relative h-20 w-full rounded-xl overflow-hidden border border-[#E8E2D7]">
            <img src={bannerUrl} alt="Aperçu bannière" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#F0ECE4]">
        <label className="flex items-center gap-2.5 text-sm font-medium text-[#1A1A1A] cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 rounded text-[#B55234] focus:ring-[#B55234]"
          />
          <span>Menu publié et visible par les clients</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={disabled || !name.trim()}
        className="mt-1 py-3 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: activeTheme.primaryColor }}
      >
        Enregistrer les modifications
      </button>
    </form>
  );
}
