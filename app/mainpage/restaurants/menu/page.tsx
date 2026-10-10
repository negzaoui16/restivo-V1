"use client";

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

export default function MenuPage() {
  const router = useRouter();
  const { user, isReady, getAccessToken } = useAuth();
  const { currentRestaurant, isLoadingRestaurants, setIsAddRestaurantOpen } =
    useRestaurantManager();

  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MenuTab>("Items");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PublicMenuItem | null>(null);
  const [openDropdown, setOpenDropdown] = useState<FilterKey | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterPromotion, setFilterPromotion] = useState("all");
  const [filterPrice, setFilterPrice] = useState("all");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const restaurantId = currentRestaurant?.id;
  const currency = currentRestaurant?.currency ?? "TND";

  useEffect(() => {
    if (!isReady) return;
    if (!user?.canManageRestaurants) router.replace("/mainpage");
  }, [isReady, user?.canManageRestaurants, router]);

  const run = useCallback(
    async (operation: (token: string) => Promise<PublicMenu | null>) => {
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
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    if (!isReady || !restaurantId) {
      setLoadingMenu(false);
      setMenu(null);
      return;
    }

    let cancelled = false;
    setLoadingMenu(true);
    const token = getAccessToken();
    if (!token) {
      setLoadingMenu(false);
      return;
    }

    apiGetMenu(token, restaurantId)
      .then((tree) => {
        if (!cancelled) setMenu(tree);
      })
      .catch((err) => {
        if (!cancelled) {
          setMenu(null);
          setError(err instanceof ApiError ? err.message : "Could not load the menu.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMenu(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, restaurantId, getAccessToken]);

  const allItems = useMemo(
    () => menu?.categories.flatMap((category) => category.items) ?? [],
    [menu]
  );

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

  return (
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
      {error && (
        <p className="mb-3 text-xs font-semibold text-[#B55234] bg-[#FAF0EA] border border-[#F3DFD4] rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {activeTab === "Items" && (
        <div className="flex flex-col lg:flex-row gap-0 mt-1">
          <div className="flex-1 min-w-0 flex flex-col gap-0">
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
                  actionMenuId={actionMenuId}
                  setActionMenuId={setActionMenuId}
                />
              </div>
            </div>
          </div>

          {addPanelOpen && (
            <AddMenuItemPanel
              key={editingItem?.id ?? "new"}
              editingItem={editingItem}
              categories={menu.categories}
              currency={currency}
              saving={saving}
              onSave={(input) => {
                void run(async (token) => {
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
  );
}
