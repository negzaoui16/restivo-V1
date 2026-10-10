"use client";

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { NextReservationCard } from "./_components/NextReservationCard";
import { CategoryFilters } from "./_components/CategoryFilters";
import { FeaturedRestaurants } from "./_components/FeaturedRestaurants";
import { NearYouRestaurants } from "./_components/NearYouRestaurants";
import { Explore3DModal } from "./_components/Explore3DModal";
import { ReservationModal } from "./_components/ReservationModal";
import { useMainpage } from "./_components/MainpageProvider";
import {
  USER_PROFILE,
  CURRENT_RESERVATION,
  FEATURED_RESTAURANTS,
  NEARBY_RESTAURANTS,
  Restaurant,
  Reservation,
} from "./_data/restaurants";

export default function MainHomePage() {
  const { searchQuery, setSearchQuery } = useMainpage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<string[]>(["maison-olive"]);

  const [selectedFor3D, setSelectedFor3D] = useState<Restaurant | null>(null);
  const [selectedForReserve, setSelectedForReserve] = useState<Restaurant | null>(null);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation>(CURRENT_RESERVATION);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFeatured = useMemo(() => {
    return FEATURED_RESTAURANTS.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "nearby" ||
        r.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const filteredNearby = useMemo(() => {
    return NEARBY_RESTAURANTS.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "nearby" ||
        r.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
      setCurrentReservation({
        id: `res-${Math.floor(1000 + Math.random() * 9000)}`,
        restaurantName: selectedForReserve.name,
        restaurantImage: selectedForReserve.image,
        date: details.date.split(",")[0],
        time: details.time,
        table: details.table,
        guests: details.guests,
        status: "Confirmed",
      });
    }
  };

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch mt-3">
        <div className="lg:col-span-7 flex flex-col justify-between py-1">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
              {USER_PROFILE.greeting},{" "}
              <span className="text-[#B55234]">{USER_PROFILE.name}</span>
            </h1>
            <p className="text-sm text-[#736D65] mt-1 font-normal">
              {USER_PROFILE.subtitle}
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
              const target = FEATURED_RESTAURANTS.find(
                (r) => r.name === currentReservation.restaurantName
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
        onViewAll={() => setSelectedCategory("all")}
      />

      <NearYouRestaurants
        restaurants={filteredNearby}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onSelectRestaurant={(restaurant) => handleOpenReserve(restaurant)}
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
    </>
  );
}
