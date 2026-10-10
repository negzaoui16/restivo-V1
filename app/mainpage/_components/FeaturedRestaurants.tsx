"use client";

import React from "react";
import Image from "next/image";
import { 
  Star, 
  MapPin, 
  Heart, 
  Box, 
  ArrowRight 
} from "lucide-react";
import { Restaurant } from "../_data/restaurants";

interface FeaturedRestaurantsProps {
  restaurants: Restaurant[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onReserve: (restaurant: Restaurant) => void;
  onExplore3D: (restaurant: Restaurant) => void;
  onViewAll?: () => void;
}

export function FeaturedRestaurants({
  restaurants,
  favorites,
  onToggleFavorite,
  onReserve,
  onExplore3D,
  onViewAll,
}: FeaturedRestaurantsProps) {
  return (
    <section className="mt-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
          Featured restaurants
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#B55234] hover:text-[#9E4328] flex items-center gap-1 transition-colors group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {restaurants.map((restaurant) => {
          const isFavorite = favorites.includes(restaurant.id);

          return (
            <div
              key={restaurant.id}
              className="bg-white rounded-2xl border border-[#E8E2D7] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group"
            >
              {/* Image banner with overlay badges */}
              <div className="relative h-44 w-full overflow-hidden bg-[#ECE7DC]">
                <Image
                  src={restaurant.image}
                  alt={restaurant.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Top-left: Explore in 3D badge */}
                {restaurant.has3D && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExplore3D(restaurant);
                    }}
                    className="absolute top-3 left-3 bg-white/90 hover:bg-white backdrop-blur-md text-[#1A1A1A] text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-white/60 transition-transform active:scale-95"
                  >
                    <Box className="w-3.5 h-3.5 text-[#B55234]" />
                    <span>Explore in 3D</span>
                  </button>
                )}

                {/* Top-right: Favorite Heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(restaurant.id);
                  }}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    isFavorite
                      ? "bg-white text-[#E53935] shadow-sm"
                      : "bg-black/30 backdrop-blur-xs text-white hover:bg-black/45"
                  }`}
                  aria-label="Add to favorites"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isFavorite ? "fill-[#E53935]" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Card Details */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="text-[15px] font-bold text-[#1A1A1A] group-hover:text-[#B55234] transition-colors">
                    {restaurant.name}
                  </h4>
                  <p className="text-xs text-[#7A746B] mt-0.5">
                    {restaurant.cuisine}
                  </p>
                </div>

                {/* Bottom Stats & Reserve Button */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#F2ECE4]">
                  {/* Meta: Rating, distance, price, open status */}
                  <div className="flex items-center gap-2 text-xs text-[#6B6661] flex-wrap">
                    <div className="flex items-center gap-1 font-semibold text-[#1A1A1A]">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{restaurant.rating}</span>
                    </div>
                    <span className="text-[#CCC6BA]">·</span>
                    <div className="flex items-center gap-0.5 text-[#7A746B]">
                      <MapPin className="w-3 h-3 text-[#9E988F]" />
                      <span>{restaurant.distance}</span>
                    </div>
                    <span className="text-[#CCC6BA]">·</span>
                    <span className="text-[#7A746B] font-medium">{restaurant.priceLevel}</span>
                    <span className="text-[#CCC6BA]">·</span>
                    <div className="flex items-center gap-1 text-[#227B3A] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                      <span>Open now</span>
                    </div>
                  </div>

                  {/* Reserve button */}
                  <button
                    onClick={() => onReserve(restaurant)}
                    className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#B55234] hover:bg-[#9E4328] active:scale-95 text-white text-xs font-medium transition-all shadow-2xs"
                  >
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
