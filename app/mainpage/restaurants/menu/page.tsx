"use client";

/**
 * ============================================================================
 * PAGE PRINCIPALE : GESTION DU MENU & CATÉGORIES (Espace Restaurateur / Owner)
 * ============================================================================
 * Fichier : app/mainpage/restaurants/menu/page.tsx
 *
 * RÔLE CLÉ DANS LE PROJET :
 * C'est le centre de contrôle pour le gérant du restaurant :
 * 1. Gestion des états (Menu complet, catégories, plats, filtres, recherche).
 * 2. Navigation par onglets (Items = Plats, Categories, Promotions, Settings).
 * 3. Filtrage en temps réel (par catégorie, disponibilité, tags, prix, tri).
 * 4. Déclencheur du panneau d'ajout/modification (AddMenuItemPanel) avec IA 3D.
 * 5. Intégration de l'aperçu dynamique (MenuPreview) pour voir le rendu client.
 * ============================================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { ApiError, useAuth } from "@/contexts/AuthContext";
import { useRestaurantManager } from "../_context/RestaurantManagerContext";
import type { PublicMenu, PublicMenuItem } from "@/lib/menu/types";
import {
  apiCreateCategory,
  apiCreateItem,
  apiCreateMenu,
  apiCreatePromotion,
  apiDeleteCategory,
  apiDeleteItem,
  apiDeletePromotion,
  apiGetMenu,
  apiUpdateCategory,
  apiUpdateItem,
  apiUpdateMenu,
} from "@/lib/menu/client";
import type { FilterKey, MenuTab, SortKey } from "./_lib/menu-ui";
import { MenuHeader } from "./_components/MenuHeader";
import { MenuTabs } from "./_components/MenuTabs";
import { MenuFilterBar } from "./_components/MenuFilterBar";
import { CategoriesSidebar } from "./_components/CategoriesSidebar";
import { MenuTable } from "./_components/MenuTable";
import { AddMenuItemPanel } from "./_components/AddMenuItemPanel";
import { CategoriesManager } from "./_components/CategoriesManager";
import { PromotionsPanel } from "./_components/PromotionsPanel";
import { MenuSettingsPanel } from "./_components/MenuSettingsPanel";
import { MenuPreview } from "./_components/MenuPreview";
import { PullToRefresh } from "@/app/_components/PullToRefresh";
import {
  saveMenuToLocalCache,
  getCachedMenu,
  useNetworkStatus,
} from "@/lib/offline/offline-manager";

export default function MenuPage() {
  const router = useRouter();
  // Contexte d'authentification : vérification des droits restaurateur et token JWT
  const { user, isReady, getAccessToken } = useAuth();
  // Contexte de gestion du restaurant actif (sélectionné par le gérant)
  const { currentRestaurant, isLoadingRestaurants, setIsAddRestaurantOpen } =
    useRestaurantManager();

  // --- ÉTATS LOCAUX DU MENU ---
  const [menu, setMenu] = useState<PublicMenu | null>(null); // Données complètes de l'arbre du menu
  const [loadingMenu, setLoadingMenu] = useState(true);      // Indicateur de chargement initial
  const [saving, setSaving] = useState(false);               // Indicateur d'enregistrement asynchrone (CRUD)
  const [error, setError] = useState<string | null>(null);   // Message d'erreur si une API échoue

  // --- ÉTAT DU MODE HORS-LIGNE & CACHE LOCAL ---
  const { isOnline, wasOffline } = useNetworkStatus();
  const [usingOfflineCache, setUsingOfflineCache] = useState(false);

  // --- ÉTATS D'AFFICHAGE & NAVIGATION ---
  const [activeTab, setActiveTab] = useState<MenuTab>("Items"); // Onglet actif (Items, Categories...)
  const [selectedCategory, setSelectedCategory] = useState("all"); // Catégorie filtrée ("all" ou categoryId)
  const [searchQuery, setSearchQuery] = useState("");              // Texte tapé dans la barre de recherche

  // --- ÉTATS DU FORMULAIRE D'AJOUT / MODIFICATION (DRAWER) ---
  const [addPanelOpen, setAddPanelOpen] = useState(false);              // Ouvre/ferme AddMenuItemPanel
  const [editingItem, setEditingItem] = useState<PublicMenuItem | null>(null); // Plat en cours de modif

  // --- FILTRES AVANCÉS & TRI ---
  const [openDropdown, setOpenDropdown] = useState<FilterKey | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterPromotion, setFilterPromotion] = useState("all");
  const [filterPrice, setFilterPrice] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false); // Modal d'aperçu de la carte côté client

  const restaurantId = currentRestaurant?.id;
  const currency = currentRestaurant?.currency ?? "TND";

  // SÉCURITÉ : Redirection si l'utilisateur n'est pas autorisé à gérer des restaurants
  useEffect(() => {
    if (!isReady) return;
    if (!user?.canManageRestaurants) router.replace("/mainpage");
  }, [isReady, user?.canManageRestaurants, router]);

  /**
   * Helper d'exécution sécurisée pour toutes les opérations CRUD
   * Gère automatiquement le token JWT, le state de loading (saving) et les erreurs API
   */
  const run = useCallback(
    async (operation: (token: string) => Promise<PublicMenu | null>) => {
      if (!isOnline) {
        setError("Mode Hors-Ligne : Impossible d'effectuer des modifications serveur sans connexion réseau. Vos données restent consultables.");
        return;
      }
      const token = getAccessToken();
      if (!token) {
        setError("Your session expired. Sign in again.");
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const next = await operation(token);
        setMenu(next);
        if (restaurantId && next) {
          saveMenuToLocalCache(restaurantId, next);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [getAccessToken, isOnline, restaurantId]
  );

  /**
   * CHARGEMENT INITIAL DU MENU :
   * Appelle GET /api/restaurants/[id]/menu pour récupérer les catégories et les plats.
   * Gère le fallback automatique vers le cache local (localStorage & IndexedDB) en cas
   * de coupure réseau ou de Mode Hors-Ligne.
   */
  useEffect(() => {
    if (!isReady || !restaurantId) {
      setLoadingMenu(false);
      setMenu(null);
      return;
    }

    // 1. Si l'appareil est hors-ligne d'emblée, charger immédiatement depuis le cache local
    if (!isOnline) {
      const cached = getCachedMenu(restaurantId);
      if (cached) {
        setMenu(cached);
        setUsingOfflineCache(true);
        setError(null);
      } else {
        setError("Mode Hors-Ligne : Aucun menu en cache local pour ce restaurant.");
      }
      setLoadingMenu(false);
      return;
    }

    let cancelled = false;
    setLoadingMenu(true);
    const token = getAccessToken();
    if (!token) {
      const cached = getCachedMenu(restaurantId);
      if (cached) {
        setMenu(cached);
        setUsingOfflineCache(true);
      }
      setLoadingMenu(false);
      return;
    }

    apiGetMenu(token, restaurantId)
      .then((tree) => {
        if (!cancelled) {
          setMenu(tree);
          setUsingOfflineCache(false);
          setError(null);
          // Met à jour le cache local et pré-charge les modèles 3D
          if (tree) {
            saveMenuToLocalCache(restaurantId, tree);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // Fallback sur le cache local
          const cached = getCachedMenu(restaurantId);
          if (cached) {
            setMenu(cached);
            setUsingOfflineCache(true);
            setError(null);
          } else {
            setMenu(null);
            setError(err instanceof ApiError ? err.message : "Could not load the menu.");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMenu(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, restaurantId, getAccessToken, isOnline]);

  // Récupère une liste plate de tous les plats (toutes catégories confondues)
  const allItems = useMemo(
    () => menu?.categories.flatMap((category) => category.items) ?? [],
    [menu]
  );

  /**
   * MOTEUR DE RECHERCHE ET DE FILTRAGE CÔTÉ CLIENT (Optimisé via useMemo) :
   * 1. Filtre par catégorie sélectionnée.
   * 2. Recherche textuelle (nom, description, nom de catégorie).
   * 3. Filtre de disponibilité (en stock / épuisé).
   * 4. Filtre de promotions actives.
   * 5. Tranche de prix (moins de 15 TND, 15-30, etc.).
   * 6. Filtre par Tag diététique (ex: "halal", "vegan").
   * 7. Tri (En vedette, Prix croissant, ou Ordre alphabétique).
   */
  const filteredItems = useMemo(() => {
    let result = [...allItems];

    if (selectedCategory !== "all") {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description ?? "").toLowerCase().includes(query) ||
          item.categoryName.toLowerCase().includes(query)
      );
    }

    if (filterAvailability === "available") {
      result = result.filter((item) => item.isAvailable);
    } else if (filterAvailability === "unavailable") {
      result = result.filter((item) => !item.isAvailable);
    }

    if (filterPromotion === "with") {
      result = result.filter((item) => item.promotionLabel);
    } else if (filterPromotion === "without") {
      result = result.filter((item) => !item.promotionLabel);
    }

    if (filterPrice === "under-15") result = result.filter((item) => item.price < 15);
    else if (filterPrice === "15-30") {
      result = result.filter((item) => item.price >= 15 && item.price <= 30);
    } else if (filterPrice === "30-50") {
      result = result.filter((item) => item.price > 30 && item.price <= 50);
    } else if (filterPrice === "over-50") result = result.filter((item) => item.price > 50);

    if (filterTag && filterTag !== "all") {
      result = result.filter((item) => (item.description ?? "").includes(filterTag));
    }

    if (sortBy === "featured") {
      result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
    } else if (sortBy === "price") {
      result.sort((a, b) => a.price - b.price);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [
    allItems,
    selectedCategory,
    searchQuery,
    filterAvailability,
    filterPromotion,
    filterPrice,
    filterTag,
    sortBy,
  ]);

  if (!isReady || isLoadingRestaurants || loadingMenu) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[#7A746B]">
        Loading menu…
      </div>
    );
  }

  if (!currentRestaurant || !restaurantId) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF0EA] text-[#B55234] flex items-center justify-center mb-4">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Create a restaurant first</h1>
        <p className="text-sm text-[#736D65] mt-2 max-w-md">
          A menu belongs to a venue. Add a restaurant, then come back to build the menu.
        </p>
        <button
          type="button"
          onClick={() => setIsAddRestaurantOpen(true)}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B55234] hover:bg-[#9E4328] text-white text-sm font-bold"
        >
          Add a restaurant
        </button>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Create a menu</h1>
        <p className="text-sm text-[#736D65] mt-2 max-w-md">
          Start with a draft menu for {currentRestaurant.name}. You can add categories, dishes, and
          promotions next.
        </p>
        {error && <p className="text-xs text-[#B55234] mt-3">{error}</p>}
        <button
          type="button"
          disabled={saving}
          onClick={() =>
            run((token) =>
              apiCreateMenu(token, restaurantId, { name: `${currentRestaurant.name} menu` })
            )
          }
          className="mt-5 px-4 py-2.5 rounded-xl bg-[#B55234] hover:bg-[#9E4328] text-white text-sm font-bold disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create menu"}
        </button>
      </div>
    );
  }

  // Handler de rafraîchissement au doigt (Pull-to-Refresh comme sur Facebook)
  const handleRefreshMenu = useCallback(async () => {
    if (!restaurantId) return;
    const token = getAccessToken();
    if (token && isOnline) {
      try {
        const tree = await apiGetMenu(token, restaurantId);
        if (tree) {
          setMenu(tree);
          saveMenuToLocalCache(restaurantId, tree);
        }
      } catch (err) {
        const cached = getCachedMenu(restaurantId);
        if (cached) setMenu(cached);
      }
    } else {
      const cached = getCachedMenu(restaurantId);
      if (cached) setMenu(cached);
    }
  }, [restaurantId, getAccessToken, isOnline]);

  return (
    <PullToRefresh onRefresh={handleRefreshMenu}>
      <div className="flex flex-col gap-0 select-none animate-in fade-in duration-300">
      <MenuHeader
        title={menu.name}
        isPublished={menu.isPublished}
        isSaving={saving}
        canAddItem={menu.categories.length > 0}
        onAddItem={() => {
          setEditingItem(null);
          setAddPanelOpen(true);
        }}
        onPreview={() => setPreviewOpen(true)}
        onPublish={() => run((token) => apiUpdateMenu(token, restaurantId, { isPublished: true }))}
      />
      <MenuTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* Bannière d'état Mode Hors-Ligne & Cache */}
      {(!isOnline || usingOfflineCache) && (
        <div className="mb-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-amber-950 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>Mode Hors-Ligne 📴</strong> — Données chargées depuis le cache local sécurisé. L&apos;aperçu du menu et la réalité augmentée 3D restent 100% opérationnels.
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full shrink-0">
            Données Locales Actives
          </span>
        </div>
      )}

      {wasOffline && isOnline && (
        <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-950 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <strong>Connexion rétablie 🟢</strong> — Vos données sont synchronisées en direct avec le serveur.
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-3 text-xs font-semibold text-[#B55234] bg-[#FAF0EA] border border-[#F3DFD4] rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {activeTab === "Items" && (
        <div className="flex flex-col gap-0 mt-1">
          <div className="w-full min-w-0 flex flex-col gap-0">
            <MenuFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              filterAvailability={filterAvailability}
              setFilterAvailability={setFilterAvailability}
              filterPromotion={filterPromotion}
              setFilterPromotion={setFilterPromotion}
              filterPrice={filterPrice}
              setFilterPrice={setFilterPrice}
              filterTag={filterTag}
              setFilterTag={setFilterTag}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={menu.categories}
            />

            <div className="flex gap-0 mt-2">
              <div className="hidden lg:block w-[200px] xl:w-[220px] shrink-0 pr-3">
                <CategoriesSidebar
                  categories={menu.categories}
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                  disabled={saving}
                  onAdd={(name) => run((token) => apiCreateCategory(token, restaurantId, { name }))}
                />
              </div>
              <div className="flex-1 min-w-0">
                <MenuTable
                  items={filteredItems}
                  currency={currency}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setAddPanelOpen(true);
                    setActionMenuId(null);
                  }}
                  onDelete={(id) => run((token) => apiDeleteItem(token, restaurantId, id))}
                  onDuplicate={(item) =>
                    run((token) =>
                      apiCreateItem(token, restaurantId, {
                        categoryId: item.categoryId,
                        name: `${item.name} (copy)`,
                        description: item.description ?? undefined,
                        imageUrl: item.imageUrl ?? undefined,
                        model3dUrl: item.model3dUrl ?? undefined,
                        price: item.price,
                        isAvailable: item.isAvailable,
                        isFeatured: false,
                      })
                    )
                  }
                  onToggleAvailability={(id) => {
                    const item = allItems.find((row) => row.id === id);
                    if (!item) return;
                    void run((token) =>
                      apiUpdateItem(token, restaurantId, id, { isAvailable: !item.isAvailable })
                    );
                  }}
                  onToggleFeatured={(id) => {
                    const item = allItems.find((row) => row.id === id);
                    if (!item) return;
                    void run((token) =>
                      apiUpdateItem(token, restaurantId, id, { isFeatured: !item.isFeatured })
                    );
                  }}
                  actionMenuId={actionMenuId}
                  setActionMenuId={setActionMenuId}
                />
              </div>
            </div>
          </div>

          {/* DRAWER D'AJOUT ET MODIFICATION DU PLAT (Contient l'IA 3D & Tags) */}
          {addPanelOpen && (
            <AddMenuItemPanel
              key={editingItem?.id ?? "new"}
              editingItem={editingItem}
              categories={menu.categories}
              currency={currency}
              saving={saving}
              onSave={(input) => {
                void run(async (token) => {
                  // Si editingItem existe -> PUT/PATCH (Modification), sinon -> POST (Création)
                  const next = editingItem
                    ? await apiUpdateItem(token, restaurantId, editingItem.id, input)
                    : await apiCreateItem(token, restaurantId, input);
                  setAddPanelOpen(false);
                  setEditingItem(null);
                  return next;
                });
              }}
              onClose={() => {
                setAddPanelOpen(false);
                setEditingItem(null);
              }}
            />
          )}
        </div>
      )}

      {activeTab === "Categories" && (
        <CategoriesManager
          categories={menu.categories}
          disabled={saving}
          onRename={(id, name) => run((token) => apiUpdateCategory(token, restaurantId, id, { name }))}
          onReorder={(currentId, targetId) => {
            const currentCat = menu.categories.find((c) => c.id === currentId);
            const targetCat = menu.categories.find((c) => c.id === targetId);
            if (!currentCat || !targetCat) return;
            void run(async (token) => {
              await apiUpdateCategory(token, restaurantId, currentId, { sortOrder: targetCat.sortOrder });
              return apiUpdateCategory(token, restaurantId, targetId, { sortOrder: currentCat.sortOrder });
            });
          }}
          onDelete={(id) =>
            run(async (token) => {
              const next = await apiDeleteCategory(token, restaurantId, id);
              if (selectedCategory === id) setSelectedCategory("all");
              return next;
            })
          }
        />
      )}

      {activeTab === "Promotions" && (
        <PromotionsPanel
          menu={menu}
          currency={currency}
          disabled={saving}
          onCreate={(input) => run((token) => apiCreatePromotion(token, restaurantId, input))}
          onDelete={(id) => run((token) => apiDeletePromotion(token, restaurantId, id))}
        />
      )}

      {activeTab === "Menu settings" && (
        <MenuSettingsPanel
          key={`${menu.id}-${menu.name}-${menu.isPublished}`}
          menu={menu}
          disabled={saving}
          onSave={(input) => run((token) => apiUpdateMenu(token, restaurantId, input))}
        />
      )}

      {(openDropdown || actionMenuId) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setOpenDropdown(null);
            setActionMenuId(null);
          }}
        />
      )}

      {previewOpen && (
        <MenuPreview
          restaurant={currentRestaurant}
          menu={menu}
          currency={currency}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
    </PullToRefresh>
  );
}
