"use client";

import React from "react";
import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";
import { Reservation } from "../_data/restaurants";

interface NextReservationCardProps {
  reservation: Reservation;
  onViewReservation: () => void;
  onOpenRestaurant: () => void;
}

export function NextReservationCard({
  reservation,
  onViewReservation,
  onOpenRestaurant,
}: NextReservationCardProps) {
  return (
    <div className="bg-white/90 rounded-2xl border border-[#E8E2D7] p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-200">
      <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
        {/* Restaurant Thumbnail */}
        <div className="relative w-full sm:w-24 h-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-[#EFE9DF]">
          <Image
            src={reservation.restaurantImage}
            alt={reservation.restaurantName}
            fill
            className="object-cover"
          />
        </div>

        {/* Details & Actions */}
        <div className="flex-1 min-w-0 w-full">
          {/* Header Row: Label & Status Badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7C6355]">
              <Calendar className="w-3.5 h-3.5 text-[#B55234]" />
              <span>Your next reservation</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EA] text-[#227B3A] border border-[#C6E6CD]">
              {reservation.status}
            </span>
          </div>

          {/* Restaurant Title & Info */}
          <h4 className="text-[15px] font-bold text-[#1A1A1A] truncate">
            {reservation.restaurantName}
          </h4>
          <p className="text-xs text-[#7A746B] mt-0.5">
            {reservation.date} · {reservation.time} · {reservation.table} · {reservation.guests} guests
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={onViewReservation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#B55234] hover:bg-[#9E4328] active:scale-95 text-white text-xs font-medium transition-all shadow-2xs"
            >
              <span>View reservation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenRestaurant}
              className="px-3.5 py-1.5 rounded-full border border-[#D8D2C5] hover:bg-black/5 active:scale-95 text-[#423E3A] text-xs font-medium transition-colors"
            >
              Open restaurant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
