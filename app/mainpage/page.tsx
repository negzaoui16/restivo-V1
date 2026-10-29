"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { NextReservationCard } from "./_components/NextReservationCard";
import { CategoryFilters } from "./_components/CategoryFilters";
import { FeaturedRestaurants } from "./_components/FeaturedRestaurants";
import { NearYouRestaurants } from "./_components/NearYouRestaurants";
import { Explore3DModal } from "./_components/Explore3DModal";
import { ReservationModal } from "./_components/ReservationModal";
import { MenuPreview } from "./restaurants/menu/_components/MenuPreview";
import { useMainpage } from "./_components/MainpageProvider";
import { useAuth } from "@/contexts/AuthContext";
import { PullToRefresh } from "@/app/_components/PullToRefresh";
import type { PublicMenu } from "@/lib/menu/types";
import {
  CURRENT_RESERVATION,
  FEATURED_RESTAURANTS,
  NEARBY_RESTAURANTS,
  Restaurant,
  Reservation,
} from "./_data/restaurants";

export default function MainHomePage() {
  const { searchQuery, setSearchQuery } = useMainpage();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<string[]>(["maison-olive"]);

  const [featuredRestaurants, setFeaturedRestaurants] = useState<Restaurant[]>(FEATURED_RESTAURANTS);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>(NEARBY_RESTAURANTS);
  const [loadingExplore, setLoadingExplore] = useState(true);

  const [selectedFor3D, setSelectedFor3D] = useState<Restaurant | null>(null);
  const [selectedForReserve, setSelectedForReserve] = useState<Restaurant | null>(null);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation>(CURRENT_RESERVATION);

  const [activeMenuRestaurant, setActiveMenuRestaurant] = useState<Restaurant | null>(null);
  const [activeMenu, setActiveMenu] = useState<PublicMenu | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = user?.displayName || user?.firstName || "Ahmed";

  // Fetch real restaurants dynamically from database
  useEffect(() => {
    fetch("/api/explore")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.featured)) {
          setFeaturedRestaurants(data.featured);
          if (Array.isArray(data.nearby)) {
            setNearbyRestaurants(data.nearby);
          }
        }
      })
      .catch((err) => {
        console.error("Explore API fetch failed:", err);
      })
      .finally(() => {
        setLoadingExplore(false);
      });
  }, []);

  // Load saved reservation from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("restivo_customer_reservation");
      if (saved) {
        setCurrentReservation(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFeatured = useMemo(() => {
    return featuredRestaurants.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        r.name.toLowerCase().includes(query) ||
        r.cuisine.toLowerCase().includes(query) ||
        (r.address ?? "").toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "nearby" ||
        r.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [featuredRestaurants, searchQuery, selectedCategory]);

  const filteredNearby = useMemo(() => {
    return nearbyRestaurants.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        r.name.toLowerCase().includes(query) ||
        r.cuisine.toLowerCase().includes(query) ||
        (r.address ?? "").toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "nearby" ||
        r.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [nearbyRestaurants, searchQuery, selectedCategory]);

  const handleOpenReserve = (restaurant: Restaurant) => {
    setSelectedForReserve(restaurant);
    setViewingReservation(null);
    setReservationModalOpen(true);
  };

  const handleViewCurrentReservation = () => {
    setViewingReservation(currentReservation);
    setSelectedForReserve(null);
    setReservationModalOpen(true);
  };

  const handleReservationSuccess = (details: {
    date: string;
    time: string;
    guests: number;
    table: string;
  }) => {
    if (selectedForReserve) {
      const newRes: Reservation = {
        id: `res-${Math.floor(1000 + Math.random() * 9000)}`,
        restaurantName: selectedForReserve.name,
        restaurantImage: selectedForReserve.image,
        date: details.date.split(",")[0],
        time: details.time,
        table: details.table,
        guests: details.guests,
        status: "Confirmed",
      };
      setCurrentReservation(newRes);
      try {
        localStorage.setItem("restivo_customer_reservation", JSON.stringify(newRes));
      } catch {
        // Ignore
      }
    }
  };

  const handleOpenMenu = async (restaurant: Restaurant) => {
    setActiveMenuRestaurant(restaurant);
    setLoadingMenu(true);
    try {
      const res = await fetch(`/api/public/menu/${restaurant.id}`);
      const data = await res.json();
      if (data.ok && data.menu) {
        setActiveMenu(data.menu);
      } else {
        // Fallback default menu for demo venues
        setActiveMenu({
          id: `menu-${restaurant.id}`,
          restaurantId: restaurant.id,
          name: `${restaurant.name} Menu`,
          description: "",
          isPublished: true,
          categories: [
            {
              id: "cat-1",
              name: "Spécialités de la maison",
              description: "Nos plats signatures préparés à la commande",
              imageUrl: null,
              sortOrder: 0,
              isActive: true,
              itemCount: 2,
              items: [
                {
                  id: "item-1",
                  categoryId: "cat-1",
                  categoryName: "Spécialités",
                  name: `${restaurant.name} Signature`,
                  description: "Ingrédients frais locaux, préparation traditionnelle",
                  imageUrl: restaurant.image,
                  model3dUrl: null,
                  price: 24,
                  isAvailable: true,
                  isFeatured: true,
                  sortOrder: 0,
                  preparationTime: null,
                  promotionLabel: "Populaire",
                },
              ],
            },
          ],
          promotions: [],
        });
      }
    } catch {
      // Fallback
    } finally {
      setLoadingMenu(false);
    }
  };

  const refreshExplore = async () => {
    try {
      const res = await fetch("/api/explore");
      const data = await res.json();
      if (data.ok && Array.isArray(data.featured)) {
        setFeaturedRestaurants(data.featured);
        if (Array.isArray(data.nearby)) {
          setNearbyRestaurants(data.nearby);
        }
      }
    } catch (e) {
      console.warn("Failed to refresh explore:", e);
    }
  };

  return (
    <PullToRefresh onRefresh={refreshExplore}>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch mt-3">
        <div className="lg:col-span-7 flex flex-col justify-between py-1">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
              {greeting},{" "}
              <span className="text-[#B55234]">{userName}</span>
            </h1>
            <p className="text-sm text-[#736D65] mt-1 font-normal">
              Where would you like to dine today?
            </p>
          </div>

          <div className="mt-5 relative flex items-center">
            <div className="w-full bg-white rounded-full border border-[#E5DEC9] shadow-xs px-4 py-2.5 sm:py-3 flex items-center gap-3 focus-within:border-[#B55234] focus-within:ring-2 focus-within:ring-[#B55234]/20 transition-all">
              <Search className="w-4.5 h-4.5 text-[#9E988F] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, cuisines or dishes"
                className="w-full bg-transparent text-xs sm:text-sm text-[#1A1A1A] placeholder-[#9E988F] outline-none"
              />
              <button
                className="p-1.5 rounded-lg text-[#6B6661] hover:text-[#1A1A1A] hover:bg-black/5 transition-colors shrink-0"
                title="Filter options"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center">
          <NextReservationCard
            reservation={currentReservation}
            onViewReservation={handleViewCurrentReservation}
            onOpenRestaurant={() => {
              const target = featuredRestaurants.find(
                (r) => r.name.toLowerCase() === currentReservation.restaurantName.toLowerCase()
              );
              if (target) setSelectedFor3D(target);
            }}
          />
        </div>
      </section>

      <div className="mt-5">
        <CategoryFilters
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      <FeaturedRestaurants
        restaurants={filteredFeatured}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onReserve={handleOpenReserve}
        onExplore3D={(restaurant) => setSelectedFor3D(restaurant)}
        onViewMenu={handleOpenMenu}
        onViewAll={() => setSelectedCategory("all")}
      />

      <NearYouRestaurants
        restaurants={filteredNearby}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onSelectRestaurant={(restaurant) => handleOpenReserve(restaurant)}
        onViewMenu={handleOpenMenu}
        onViewAll={() => setSelectedCategory("nearby")}
      />

      <Explore3DModal
        restaurant={selectedFor3D}
        onClose={() => setSelectedFor3D(null)}
        onReserve={(rest) => handleOpenReserve(rest)}
      />

      <ReservationModal
        restaurant={selectedForReserve}
        existingReservation={viewingReservation}
        isOpen={reservationModalOpen}
        onClose={() => setReservationModalOpen(false)}
        onSuccess={handleReservationSuccess}
      />

      {activeMenuRestaurant && activeMenu && (
        <MenuPreview
          restaurant={{
            id: activeMenuRestaurant.id,
            name: activeMenuRestaurant.name,
            location: activeMenuRestaurant.address || "Tunis, Tunisia",
            city: "Tunis",
            cuisine: activeMenuRestaurant.cuisine || "Mediterranean",
            image: activeMenuRestaurant.image,
            logoUrl: activeMenuRestaurant.image,
            description: activeMenuRestaurant.cuisine,
            phone: "+216 71 000 000",
            role: "OWNER",
            status: "Open",
            tablesCount: 12,
            capacity: 48,
            floorsCount: 1,
            rating: activeMenuRestaurant.rating || 4.9,
            slug: activeMenuRestaurant.id,
            dbStatus: "ACTIVE",
          }}
          menu={activeMenu}
          currency="TND"
          isClientView={true}
          onClose={() => {
            setActiveMenuRestaurant(null);
            setActiveMenu(null);
          }}
        />
      )}
    </PullToRefresh>
  );
}
