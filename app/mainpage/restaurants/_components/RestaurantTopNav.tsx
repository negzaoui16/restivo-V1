"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Home,
  CheckCircle2,
  AlertCircle,
  Plus,
  Store,
} from "lucide-react";
import { useRestaurantManager } from "../_context/RestaurantManagerContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export function RestaurantTopNav() {
  const {
    currentRestaurant,
    mobileMenuOpen,
    setMobileMenuOpen,
    searchQuery,
    setSearchQuery,
    setIsAddRestaurantOpen,
    openRestaurantProfile,
  } = useRestaurantManager();
  const { user } = useAuth();
  const pathname = usePathname();
  const sectionLabel = pathname?.startsWith("/mainpage/restaurants/menu")
    ? "Menu"
    : pathname?.startsWith("/mainpage/restaurants/tables")
      ? "Tables"
      : pathname?.startsWith("/mainpage/restaurants/staff")
        ? "Staff"
        : "Overview";

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  const userName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Ahmed";
  const userAvatar = user?.avatarUrl || "/images/ahmed-avatar.jpg";

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#ECE7DC]">
      {/* Left Breadcrumb & Mobile Menu Toggle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-[#4A4643] hover:text-[#1A1A1A] hover:bg-black/5"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb matching image: "🏠 Maison Olive / Overview" */}
        <div className="flex items-center gap-2 text-xs sm:text-[13px] text-[#736D65] font-medium">
          <button
            onClick={() => openRestaurantProfile(currentRestaurant)}
            className="flex items-center gap-1.5 hover:text-[#B55234] transition-colors"
            title="Click to view Restaurant Profile"
          >
            <Home className="w-3.5 h-3.5 text-[#B55234]" />
            <span className="font-semibold text-[#1A1A1A] hover:underline underline-offset-2">
              {currentRestaurant?.name ?? "Your restaurant"}
            </span>
          </button>
          <span className="text-[#A39C91]">/</span>
          <span className="text-[#736D65]">{sectionLabel}</span>
        </div>
      </div>

      {/* Right Controls: Search, Bell, Help, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search input pill */}
        <div className="relative hidden sm:block w-44 md:w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9E988F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-white/70 hover:bg-white focus:bg-white text-xs text-[#1A1A1A] placeholder-[#9E988F] pl-8.5 pr-3 py-1.5 rounded-full border border-[#E8E4DA] focus:border-[#B55234] focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setHasUnreadNotification(false);
            }}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-[#E8E4DA] flex items-center justify-center text-[#4A4643] hover:text-[#1A1A1A] transition-all relative shadow-2xs"
            aria-label="View notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {hasUnreadNotification && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E53E3E] ring-2 ring-[#FAF7F2]" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E5DEC9] shadow-xl p-3.5 z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DC] mb-2">
                <span className="text-xs font-bold text-[#1A1A1A]">Live Alerts</span>
                <span className="text-[10px] text-[#B55234] font-medium cursor-pointer">
                  Mark read
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FAF0EA]/60 text-xs">
                  <AlertCircle className="w-4 h-4 text-[#B55234] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Table 12 Request</p>
                    <p className="text-[11px] text-[#7A746B]">
                      Guest requested bill · 1,240 TND
                    </p>
                    <span className="text-[9px] text-[#9E988F]">2 mins ago</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#F0FDF4] text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">New Reservation</p>
                    <p className="text-[11px] text-[#7A746B]">
                      Sami Ben Ali (2 guests) for 10:30
                    </p>
                    <span className="text-[9px] text-[#9E988F]">12 mins ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help icon button */}
        <button
          onClick={() => alert("Restivo Restaurant Manager v2.4\nFast support: help@restivo.app")}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-[#E8E4DA] flex items-center justify-center text-[#4A4643] hover:text-[#1A1A1A] transition-all shadow-2xs"
          aria-label="Help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Ahmed User Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-white/70 hover:bg-white border border-[#E8E4DA] transition-all shadow-2xs"
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-[#D8D2C5]">
              <Image
                src={userAvatar}
                alt={userName}
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xs font-semibold text-[#24211E] hidden sm:inline">
              {userName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#7A746B] transition-transform duration-200 ${
                profileDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-[#E5DEC9] shadow-xl p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-[#ECE7DC] mb-1">
                <p className="text-xs font-bold text-[#1A1A1A]">{userName}</p>
                <p className="text-[10px] text-[#7A746B]">Restaurant Administrator</p>
              </div>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  openRestaurantProfile(currentRestaurant);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#1A1A1A] hover:bg-[#FAF7F2] font-semibold text-left"
              >
                <Store className="w-3.5 h-3.5 text-[#B55234]" />
                <span>Restaurant Profile</span>
              </button>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setIsAddRestaurantOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#B55234] hover:bg-[#FAF0EA] font-semibold text-left"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add restaurant</span>
              </button>

              <Link
                href="/mainpage/profile"
                onClick={() => setProfileDropdownOpen(false)}
                className="block px-3 py-1.5 rounded-lg text-xs text-[#3D3A36] hover:bg-[#FAF7F2]"
              >
                Account Profile
              </Link>

              <Link
                href="/mainpage"
                onClick={() => setProfileDropdownOpen(false)}
                className="block px-3 py-1.5 rounded-lg text-xs text-[#3D3A36] hover:bg-[#FAF7F2]"
              >
                Customer Diner App
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
