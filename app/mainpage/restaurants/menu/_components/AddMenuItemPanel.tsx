"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X, Sparkles, Box, Loader2, Upload } from "lucide-react";
import type { PublicMenuCategory, PublicMenuItem } from "@/lib/menu/types";
import { AVAILABLE_MENU_TAGS, formatDescriptionWithTags, parseDescriptionTags } from "@/lib/menu/tags";
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
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
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
    model3dUrl?: string;
    price: number;
    isAvailable: boolean;
    isFeatured: boolean;
  }) => void;
  onClose: () => void;
}) {
  const initialParsed = parseDescriptionTags(editingItem?.description);
  const [name, setName] = useState(editingItem?.name ?? "");
  const [categoryId, setCategoryId] = useState(editingItem?.categoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(initialParsed.text);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialParsed.tags);
  const [price, setPrice] = useState(editingItem?.price?.toString() ?? "");
  const [isAvailable, setIsAvailable] = useState(editingItem?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(editingItem?.isFeatured ?? false);
  const [imageUrl, setImageUrl] = useState(editingItem?.imageUrl ?? "");
  const [model3dUrl, setModel3dUrl] = useState(editingItem?.model3dUrl ?? "");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generating3D, setGenerating3D] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  async function handleFileChange(file: File) {
    setSelectedFile(file);
    setImageUrl(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setImageUrl(data.url);
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    let finalImageUrl = imageUrl.trim();

    if (selectedFile && (!finalImageUrl || finalImageUrl.startsWith("blob:"))) {
      try {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const res = await fetch("/api/upload-image", { method: "POST", body: fd });
        const data = await res.json();
        if (data.ok && data.url) {
          finalImageUrl = data.url;
        }
      } catch (err) {
        console.error("Failed to upload image before save:", err);
      }
    }

    const finalDescription = formatDescriptionWithTags(description, selectedTags);

    onSave({
      categoryId,
      name: name.trim(),
      description: finalDescription || undefined,
      imageUrl: finalImageUrl || undefined,
      model3dUrl: model3dUrl.trim() || undefined,
      price: parseFloat(price) || 0,
      isAvailable,
      isFeatured,
    });
  }

  async function handleGenerate3D() {
    if (!imageUrl.trim() && !selectedFile) {
      setGenerationError("Veuillez d'abord fournir une image (URL ou fichier).");
      return;
    }

    setGenerating3D(true);
    setGenerationError(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (imageUrl.trim()) {
        formData.append("imageUrl", imageUrl.trim());
      }
      if (name.trim()) formData.append("name", name.trim());
      const cat = categories.find((c) => c.id === categoryId);
      if (cat?.name) formData.append("category", cat.name);

      const res = await fetch("/api/generate-3d", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Échec de génération 3D.");
      }

      setModel3dUrl(data.model3dUrl);
    } catch (err: any) {
      setGenerationError(err?.message || "Erreur lors de la génération 3D.");
    } finally {
      setGenerating3D(false);
    }
  }

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-modal-title"
      className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-12 pointer-events-none">
        <div className="pointer-events-auto w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col border-l border-[#E8E2D7] animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2D7] bg-[#FAF7F2]">
            <div>
              <h3 id="add-item-modal-title" className="text-base font-bold text-[#1A1A1A]">
                {editingItem ? "Modifier l'article" : "Ajouter un article"}
              </h3>
              <p className="text-xs text-[#A39C91] mt-0.5">
                {editingItem ? "Mettez à jour les informations, tags et 3D" : "Remplissez les détails du plat pour le menu"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              className="w-8 h-8 rounded-lg hover:bg-[#E8E2D7] flex items-center justify-center text-[#736D65] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-4">
              <FormField label="Nom du plat" required>
                <input
                  type="text"
                  aria-label="Nom du plat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Pizza Margherita"
                  className={FORM_INPUT_CLASS}
                />
              </FormField>

        <FormField label="Catégorie" required>
          <div className="relative">
            <select
              aria-label="Catégorie"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`${FORM_INPUT_CLASS} appearance-none pr-8 cursor-pointer`}
            >
              <option value="">Sélectionnez une catégorie</option>
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
            aria-label="Description du plat"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ingrédients, recette et détails..."
            rows={2}
            className={`${FORM_INPUT_CLASS} resize-none`}
          />
        </FormField>

        <FormField label="Allergènes & Spécificités (Tags)">
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {AVAILABLE_MENU_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedTags((prev) =>
                      isSelected ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                    );
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-[#B55234] text-white border-[#B55234] shadow-2xs scale-102"
                      : "bg-[#FAF7F2] text-[#554F47] border-[#E8E2D7] hover:border-[#D4CFC6] hover:bg-white"
                  }`}
                >
                  <span className="text-xs">{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Photo du plat">
          <div className="flex flex-col gap-2">
            <input
              type="url"
              aria-label="URL de la photo du plat"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... ou téléversez un fichier ci-dessous"
              className={FORM_INPUT_CLASS}
            />
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-[#D4CFC6] hover:border-[#B55234] rounded-xl text-xs font-medium text-[#7D7568] hover:text-[#B55234] bg-[#FAF7F2] transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {uploadingImage
                    ? "Téléversement en cours..."
                    : selectedFile
                    ? selectedFile.name
                    : "Téléverser photo locale"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Téléverser photo locale"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                />
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-red-500 hover:underline px-1"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </FormField>

        {/* 3D & AR Model Generator Box */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#F5ECE1] border border-[#E8DECF]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Box className="w-4 h-4 text-[#B55234]" />
              Modèle 3D & Réalité Augmentée
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerate3D}
            disabled={generating3D || (!imageUrl.trim() && !selectedFile)}
            className="w-full py-2 px-3 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] disabled:bg-[#D4CFC6] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {generating3D ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Génération 3D par IA en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Générer en 3D / AR avec IA</span>
              </>
            )}
          </button>

          {generationError && (
            <p className="text-[11px] text-red-600 mt-2">{generationError}</p>
          )}

          {model3dUrl && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Modèle 3D Actif
                </span>
                <button
                  type="button"
                  onClick={() => setModel3dUrl("")}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  Supprimer
                </button>
              </div>
              <input
                type="text"
                aria-label="URL du modèle 3D (.glb)"
                value={model3dUrl}
                onChange={(e) => setModel3dUrl(e.target.value)}
                placeholder="/models/... ou URL .glb"
                className="w-full text-[11px] bg-white border border-emerald-200 rounded px-2 py-1 text-emerald-950 font-mono"
              />
            </div>
          )}
        </div>

        <FormField label="Prix" required>
          <div className="relative">
            <input
              type="number"
              aria-label="Prix du plat"
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

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#A39C91]" />
            <span className="text-sm font-medium text-[#1A1A1A]">Disponible</span>
          </div>
          <ToggleSwitch label="Disponible" checked={isAvailable} onChange={setIsAvailable} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#1A1A1A]">En vedette (Featured)</span>
          <ToggleSwitch label="En vedette (Featured)" checked={isFeatured} onChange={setIsFeatured} />
        </div>
        </div>
          </div>

          {/* Sticky footer actions */}
          <div className="p-4 sm:p-5 border-t border-[#E8E2D7] bg-[#FAF7F2] flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white border border-[#E8E2D7] hover:bg-[#F5F0E8] text-[#1A1A1A] text-sm font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploadingImage || !name.trim() || !categoryId || !price}
              className="flex-1 py-2.5 rounded-xl bg-[#B55234] hover:bg-[#9E4328] disabled:bg-[#D4CFC6] disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-sm"
            >
              {saving || uploadingImage ? "Enregistrement…" : editingItem ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
