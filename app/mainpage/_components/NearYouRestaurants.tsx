"use client";

import React from "react";
import Image from "next/image";
import { Star, MapPin, Heart, ArrowRight } from "lucide-react";
import { Restaurant } from "../_data/restaurants";

interface NearYouRestaurantsProps {
  restaurants: Restaurant[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onViewAll?: () => void;
}

export function NearYouRestaurants({
  restaurants,
  favorites,
  onToggleFavorite,
  onSelectRestaurant,
  onViewAll,
}: NearYouRestaurantsProps) {
  return (
    <section className="mt-7 mb-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
            Near you
          </h3>
          <p className="text-xs text-[#7A746B] mt-0.5">
            Restaurants around Tunis
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#B55234] hover:text-[#9E4328] flex items-center gap-1 transition-colors group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {restaurants.map((restaurant) => {
          const isFavorite = favorites.includes(restaurant.id);

          return (
            <div
              key={restaurant.id}
              className="bg-white rounded-2xl border border-[#E8E2D7] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
              onClick={() => onSelectRestaurant(restaurant)}
            >
              {/* Image Thumbnail */}
              <div className="relative h-32 w-full overflow-hidden bg-[#ECE7DC]">
                <Image
                  src={restaurant.image}
                  alt={restaurant.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Top-right: Favorite Heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(restaurant.id);
                  }}
                  className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    isFavorite
                      ? "bg-white text-[#E53935] shadow-xs"
                      : "bg-black/30 backdrop-blur-xs text-white hover:bg-black/45"
                  }`}
                  aria-label="Add to favorites"
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${
                      isFavorite ? "fill-[#E53935]" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Card Details */}
              <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] truncate group-hover:text-[#B55234] transition-colors">
                    {restaurant.name}
                  </h4>
                  <p className="text-[11px] text-[#7A746B] mt-0.5 truncate">
                    {restaurant.cuisine}
                  </p>

                  {/* Rating, distance, price */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B6661] mt-2">
                    <div className="flex items-center gap-1 font-semibold text-[#1A1A1A]">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{restaurant.rating}</span>
                    </div>
                    <span className="text-[#CCC6BA]">·</span>
                    <div className="flex items-center gap-0.5 text-[#7A746B]">
                      <MapPin className="w-2.5 h-2.5 text-[#9E988F]" />
                      <span>{restaurant.distance}</span>
                    </div>
                    {restaurant.priceLevel && (
                      <>
                        <span className="text-[#CCC6BA]">·</span>
                        <span className="text-[#7A746B] font-medium">{restaurant.priceLevel}</span>
                      </>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-medium">
                    {restaurant.isOpen ? (
                      <span className="text-[#227B3A] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                        <span>Open now</span>
                      </span>
                    ) : (
                      <span className="text-[#C62828] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]" />
                        <span>Closed</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* View restaurant link */}
                <div className="pt-2.5 mt-2 border-t border-[#F2ECE4]">
                  <span className="text-xs font-medium text-[#B55234] group-hover:text-[#9E4328] inline-flex items-center gap-1">
                    <span>View restaurant</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
