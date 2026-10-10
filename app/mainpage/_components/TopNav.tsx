"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, ChevronDown, Bell, Menu } from "lucide-react";
import { USER_PROFILE } from "../_data/restaurants";
import { useMainpage } from "./MainpageProvider";
import { useAuth } from "@/contexts/AuthContext";
import { profileInitials } from "../_lib/profile";

export function TopNav() {
  const { searchQuery, setSearchQuery, openMobileMenu } = useMainpage();
  const { user } = useAuth();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(USER_PROFILE.location);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const locations = ["Tunis, Tunisia", "La Marsa, Tunis", "Carthage, Tunis", "Sidi Bou Saïd, Tunis"];
  const profileName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    USER_PROFILE.name;
  const initials = profileInitials(user?.firstName, user?.lastName, user?.displayName);

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-4 pb-4">
      {/* Mobile Hamburger + Search */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        <button
          onClick={openMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#4A4643] hover:text-[#1A1A1A] hover:bg-black/5"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Top search bar pill */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E988F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, cuisines or dishes"
            className="w-full bg-[#FAF7F2]/60 hover:bg-white focus:bg-white text-xs sm:text-[13px] text-[#1A1A1A] placeholder-[#9E988F] pl-9.5 pr-4 py-2 rounded-full border border-[#E8E4DA] focus:border-[#B55234] focus:outline-none transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right controls: Location + Bell + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Location Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F2]/80 hover:bg-white border border-[#E8E4DA] text-xs font-medium text-[#2E2B28] transition-all shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5 text-[#6B6661]" />
            <span className="hidden sm:inline">{selectedLocation}</span>
            <span className="sm:hidden">Tunis</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#7A746B] transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLocationDropdown && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-[#E8E4DA] shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[11px] font-semibold text-[#8C857B] uppercase tracking-wider">
                Select City
              </div>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setShowLocationDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                    selectedLocation === loc
                      ? "text-[#B55234] font-semibold bg-[#FAF4EF]"
                      : "text-[#3D3A36] hover:bg-black/5"
                  }`}
                >
                  {loc}
                  {selectedLocation === loc && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B55234]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasUnreadNotification(false);
            }}
            className="w-8.5 h-8.5 rounded-full bg-[#FAF7F2]/80 hover:bg-white border border-[#E8E4DA] flex items-center justify-center text-[#4A4643] hover:text-[#1A1A1A] transition-all relative shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotification && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B55234] ring-2 ring-[#FAF7F2]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl border border-[#E8E4DA] shadow-xl p-3 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-xs font-semibold text-[#1A1A1A] mb-2 flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] text-[#8C857B] font-normal">Just now</span>
              </div>
              <div className="text-xs text-[#524D48] bg-[#F9F7F3] p-2.5 rounded-lg border border-[#EDE8DE]">
                <p className="font-semibold text-[#1A1A1A]">Reservation Confirmed</p>
                <p className="text-[11px] text-[#7A746B] mt-0.5">
                  Your table at Maison Olive for tonight at 19:30 is ready.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <Link
          href="/mainpage/profile"
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/80 transition-colors group"
        >
          {user?.avatarUrl ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#E2DDD3]">
              <Image
                src={user.avatarUrl}
                alt={profileName}
                fill
                className="object-cover"
              />
            </div>
          ) : user ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B55234] text-[10px] font-bold tracking-wide text-white ring-1 ring-[#E2DDD3]">
              {initials}
            </div>
          ) : (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#E2DDD3]">
              <Image
                src={USER_PROFILE.avatar}
                alt={profileName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <span className="hidden sm:inline text-xs font-semibold text-[#24211E]">
            {profileName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#7A746B] group-hover:text-[#1A1A1A] transition-colors" />
        </Link>
      </div>
    </header>
  );
}
