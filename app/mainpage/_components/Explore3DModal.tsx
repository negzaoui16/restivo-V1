"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Box, Layers, Maximize2, Check, User } from "lucide-react";
import { Restaurant } from "../_data/restaurants";

interface Explore3DModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
  onReserve: (restaurant: Restaurant) => void;
}

export function Explore3DModal({
  restaurant,
  onClose,
  onReserve,
}: Explore3DModalProps) {
  const [selectedTable, setSelectedTable] = useState<string>("Table 14");
  const [viewMode, setViewMode] = useState<"isometric" | "floorplan">("isometric");

  if (!restaurant) return null;

  const tables = [
    { id: "Table 12", guests: "2-4 guests", area: "Terrace Garden", status: "Available", x: "32%", y: "45%" },
    { id: "Table 14", guests: "2 guests", area: "Main Dining Room", status: "Selected", x: "55%", y: "60%" },
    { id: "Table 08", guests: "6-8 guests", area: "VIP Booth", status: "Available", x: "25%", y: "68%" },
    { id: "Table 21", guests: "2 guests", area: "Window Bay", status: "Occupied", x: "72%", y: "38%" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D7] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE7DC] bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF0EA] flex items-center justify-center text-[#B55234]">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">
                3D Interactive Table Plan — {restaurant.name}
              </h3>
              <p className="text-xs text-[#7A746B]">
                Explore dining zones and select your preferred table
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-[#EDE6DC]/60 p-1 rounded-full border border-[#DFD8CC]">
              <button
                onClick={() => setViewMode("isometric")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === "isometric"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-[#6B6661] hover:text-[#1A1A1A]"
                }`}
              >
                3D Isometric
              </button>
              <button
                onClick={() => setViewMode("floorplan")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === "floorplan"
                    ? "bg-white text-[#1A1A1A] shadow-xs"
                    : "text-[#6B6661] hover:text-[#1A1A1A]"
                }`}
              >
                Floor Plan
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#6B6661] hover:text-[#1A1A1A] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Viewport with interactive pin spots */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[440px] bg-[#222] overflow-hidden">
          <Image
            src={
              viewMode === "isometric"
                ? "/images/hero-restaurant-3d.jpg"
                : "/images/hero-floorplan-3d.jpg"
            }
            alt="3D Floorplan"
            fill
            className="object-cover opacity-90 transition-opacity duration-300"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Interactive Table Pins */}
          {tables.map((t) => {
            const isSelected = selectedTable === t.id;
            const isOccupied = t.status === "Occupied";

            return (
              <button
                key={t.id}
                onClick={() => !isOccupied && setSelectedTable(t.id)}
                disabled={isOccupied}
                style={{ left: t.x, top: t.y }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                  isSelected ? "scale-110 z-20" : "scale-100 hover:scale-105 z-10"
                } ${isOccupied ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold shadow-lg border transition-all ${
                    isSelected
                      ? "bg-[#B55234] text-white border-white ring-4 ring-[#B55234]/30"
                      : isOccupied
                      ? "bg-zinc-800/90 text-zinc-400 border-zinc-700"
                      : "bg-white/95 text-[#1A1A1A] border-white/80 hover:bg-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t.id}</span>
                </div>

                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-black/90 text-white rounded-lg p-2 text-[11px] pointer-events-none shadow-xl border border-white/10 z-30">
                  <p className="font-bold text-white">{t.area}</p>
                  <p className="text-zinc-300">{t.guests}</p>
                  <p className={`mt-0.5 font-semibold ${isOccupied ? "text-red-400" : "text-emerald-400"}`}>
                    {t.status}
                  </p>
                </div>
              </button>
            );
          })}

          {/* 3D Mode Floating Tag */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B55234]" />
            <span>Interactive 3D Engine · Drag to inspect table angles</span>
          </div>
        </div>

        {/* Footer with selected table details & reserve CTA */}
        <div className="px-6 py-4 bg-white border-t border-[#ECE7DC] flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-[#7A746B]">Selected Table</div>
            <div className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <span>{selectedTable}</span>
              <span className="text-xs font-normal text-[#6B6661]">(Indoor Tree Ambiance · 2 guests)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#D8D2C5] hover:bg-black/5 text-[#423E3A] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onReserve(restaurant);
              }}
              className="px-5 py-2 rounded-full bg-[#B55234] hover:bg-[#9E4328] active:scale-95 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Book Table with this View</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
