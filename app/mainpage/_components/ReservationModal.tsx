"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Calendar, Clock, Users, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { Restaurant, Reservation } from "../_data/restaurants";

interface ReservationModalProps {
  restaurant: Restaurant | null;
  existingReservation?: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (details: { date: string; time: string; guests: number; table: string }) => void;
}

export function ReservationModal({
  restaurant,
  existingReservation,
  isOpen,
  onClose,
  onSuccess,
}: ReservationModalProps) {
  const [selectedDate, setSelectedDate] = useState("Today, Sep 29");
  const [selectedTime, setSelectedTime] = useState(existingReservation?.time || "19:30");
  const [guests, setGuests] = useState(existingReservation?.guests || 2);
  const [selectedTable, setSelectedTable] = useState(existingReservation?.table || "Table 14");
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen || (!restaurant && !existingReservation)) return null;

  const restaurantName = restaurant?.name || existingReservation?.restaurantName || "Restaurant";
  const restaurantImage = restaurant?.image || existingReservation?.restaurantImage || "/images/restaurant-ambient.jpg";

  const timeSlots = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];
  const dates = ["Today, Sep 29", "Tomorrow, Sep 30", "Wed, Oct 1", "Thu, Oct 2"];

  const handleConfirm = () => {
    setIsConfirmed(true);
    setTimeout(() => {
      onSuccess({
        date: selectedDate,
        time: selectedTime,
        guests,
        table: selectedTable,
      });
      setIsConfirmed(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D7] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Banner with Restaurant Image */}
        <div className="relative h-36 w-full bg-[#1A1A1A]">
          <Image
            src={restaurantImage}
            alt={restaurantName}
            fill
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F4A261] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Table Reservation
            </span>
            <h3 className="text-xl font-bold leading-tight">{restaurantName}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {isConfirmed ? (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
              <CheckCircle2 className="w-16 h-16 text-[#2E7D32] animate-bounce" />
              <h4 className="text-lg font-bold text-[#1A1A1A] mt-3">Reservation Confirmed!</h4>
              <p className="text-xs text-[#7A746B] mt-1 max-w-xs">
                Your reservation at {restaurantName} for {guests} guests at {selectedTime} has been saved.
              </p>
            </div>
          ) : (
            <>
              {/* Date selection */}
              <div>
                <label className="text-xs font-semibold text-[#524D48] flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-[#B55234]" />
                  Select Date
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {dates.map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        selectedDate === date
                          ? "bg-[#B55234] text-white border-[#B55234] shadow-2xs"
                          : "bg-white border-[#E8E2D7] text-[#423E3A] hover:border-[#D5CDBD]"
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time selection */}
              <div>
                <label className="text-xs font-semibold text-[#524D48] flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-[#B55234]" />
                  Select Time
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                        selectedTime === time
                          ? "bg-[#B55234] text-white border-[#B55234] shadow-2xs"
                          : "bg-white border-[#E8E2D7] text-[#423E3A] hover:border-[#D5CDBD]"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guests and Table */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-[#524D48] flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-[#B55234]" />
                    Guests
                  </label>
                  <div className="flex items-center gap-3 bg-white border border-[#E8E2D7] rounded-xl px-3 py-1.5 justify-between">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-6 h-6 rounded-lg bg-[#FAF7F2] text-[#1A1A1A] font-bold text-sm hover:bg-[#EFE9DF]"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#1A1A1A]">{guests} guests</span>
                    <button
                      onClick={() => setGuests(Math.min(12, guests + 1))}
                      className="w-6 h-6 rounded-lg bg-[#FAF7F2] text-[#1A1A1A] font-bold text-sm hover:bg-[#EFE9DF]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#524D48] flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#B55234]" />
                    Table
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full bg-white border border-[#E8E2D7] rounded-xl px-3 py-2 text-xs font-medium text-[#1A1A1A] outline-none"
                  >
                    <option value="Table 14">Table 14 (Standard)</option>
                    <option value="Table 12">Table 12 (Terrace)</option>
                    <option value="Table 08">Table 08 (VIP Booth)</option>
                    <option value="Table 21">Table 21 (Window Bay)</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE7DC]">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[#D8D2C5] hover:bg-black/5 text-[#423E3A] text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 rounded-full bg-[#B55234] hover:bg-[#9E4328] active:scale-95 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  Confirm Reservation
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
