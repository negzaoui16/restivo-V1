"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  PlusCircle,
  Armchair,
  Settings,
  Users2,
  ShoppingBag,
  Coins,
  ChevronDown,
  Plus,
  Store,
} from "lucide-react";
import { StatCard } from "./_components/StatCard";
import { FloorPlanView } from "./_components/FloorPlanView";
import { ReservationsWidget } from "./_components/ReservationsWidget";
import { LiveOrdersWidget } from "./_components/LiveOrdersWidget";
import { EnhancePromoCard } from "./_components/EnhancePromoCard";
import { RecentActivityWidget } from "./_components/RecentActivityWidget";
import { RestaurantQuickModals } from "./_components/RestaurantQuickModals";
import { useRestaurantManager } from "./_context/RestaurantManagerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RestaurantDashboardPage() {
  const {
    currentRestaurant,
    setIsAddRestaurantOpen,
    openRestaurantProfile,
    restaurantStatus,
    setRestaurantStatus,
    isLoadingRestaurants,
  } = useRestaurantManager();

  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!user?.canManageRestaurants) router.replace("/mainpage");
  }, [isReady, user?.canManageRestaurants, router]);

  // Quick Action Modal states
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [menuItemModalOpen, setMenuItemModalOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [floorPlanModalOpen, setFloorPlanModalOpen] = useState(false);

  // Status & Date dropdown toggle
  const [statusDateDropdownOpen, setStatusDateDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("Today · Tuesday, September 24");

  const userName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "there";

  if (!isReady || isLoadingRestaurants) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-[#7A746B]">
        Loading your restaurants…
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF0EA] text-[#B55234] flex items-center justify-center mb-4">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Create your first restaurant</h1>
        <p className="text-sm text-[#736D65] mt-2 max-w-md">
          Owners and managers start here. Add a venue, set hours, and we&apos;ll create the first
          floor for your table map.
        </p>
        <button
          onClick={() => setIsAddRestaurantOpen(true)}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B55234] hover:bg-[#9E4328] text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add a restaurant
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-1 select-none animate-in fade-in duration-300">
      {/* ─── Header: Welcome, Status/Date, & Action Buttons ─── */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            Good morning, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-[#736D65] mt-1 font-normal">
            Here&apos;s what&apos;s happening at{" "}
            <button
              type="button"
              onClick={() => openRestaurantProfile(currentRestaurant)}
              className="font-bold text-[#1A1A1A] hover:text-[#B55234] underline decoration-dotted underline-offset-2 transition-colors cursor-pointer"
              title="Click to view Restaurant Profile"
            >
              {currentRestaurant.name}
            </button>{" "}
            today.
          </p>

          {/* Status & Date Bar Pill */}
          <div className="mt-3 relative inline-block">
            <button
              onClick={() => setStatusDateDropdownOpen(!statusDateDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#E8E2D7] text-xs text-[#2A2621] transition-all shadow-2xs group"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  restaurantStatus === "Open"
                    ? "bg-[#2E7D32]"
                    : restaurantStatus === "Break"
                    ? "bg-[#E65100]"
                    : "bg-[#D32F2F]"
                }`}
              />
              <span className="font-semibold">{restaurantStatus}</span>
              <span className="text-[#B5ACA0]">|</span>
              <span className="text-[#666059]">{selectedDate}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8A847C] transition-transform duration-200 ${
                  statusDateDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {statusDateDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl border border-[#E5DEC9] shadow-xl p-2.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] px-2 py-1">
                  Service State
                </div>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {(["Open", "Break", "Closed"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setRestaurantStatus(st);
                        setStatusDateDropdownOpen(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${
                        restaurantStatus === st
                          ? "bg-[#FAF0EA] text-[#B55234]"
                          : "hover:bg-[#FAF7F2] text-[#4A443D]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#ECE7DC] pt-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C857B] px-2 py-1">
                    Select Date View
                  </div>
                  {[
                    "Today · Tuesday, September 24",
                    "Tomorrow · Wednesday, September 25",
                    "Yesterday · Monday, September 23",
                  ].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDate(d);
                        setStatusDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedDate === d
                          ? "font-bold text-[#B55234] bg-[#FAF0EA]/60"
                          : "text-[#3D3A36] hover:bg-[#FAF7F2]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row matching screenshot + requested "Add a restaurant" */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Add reservation */}
          <button
            onClick={() => setReservationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#DFD8CC] hover:border-[#D0C5B5] text-xs font-semibold text-[#1A1A1A] transition-all shadow-2xs group"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#736D65] group-hover:text-[#B55234] transition-colors" />
            <span>Add reservation</span>
          </button>

          {/* Add menu item */}
          <button
            onClick={() => setMenuItemModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#DFD8CC] hover:border-[#D0C5B5] text-xs font-semibold text-[#1A1A1A] transition-all shadow-2xs group"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#736D65] group-hover:text-[#B55234] transition-colors" />
            <span>Add menu item</span>
          </button>

          {/* Add table */}
          <button
            onClick={() => setTableModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#DFD8CC] hover:border-[#D0C5B5] text-xs font-semibold text-[#1A1A1A] transition-all shadow-2xs group"
          >
            <Armchair className="w-3.5 h-3.5 text-[#736D65] group-hover:text-[#B55234] transition-colors" />
            <span>Add table</span>
          </button>

          {/* Manage restaurant */}
          <button
            onClick={() => setManageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#DFD8CC] hover:border-[#D0C5B5] text-xs font-semibold text-[#1A1A1A] transition-all shadow-2xs group"
          >
            <Settings className="w-3.5 h-3.5 text-[#736D65] group-hover:text-[#B55234] transition-colors" />
            <span>Manage restaurant</span>
          </button>

          {/* Button to Add a Restaurant (specifically requested by user!) */}
          <button
            onClick={() => setIsAddRestaurantOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B55234] hover:bg-[#9E4328] active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Add a restaurant</span>
          </button>
        </div>
      </section>

      {/* ─── 4 Statistic KPI Cards with Count-up Animations & Curved Sparklines ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's reservations */}
        <StatCard
          icon={<CalendarDays className="w-4 h-4" />}
          title="Today's reservations"
          value={24}
          trendText="+12% compared with yesterday"
          chartColor="green"
          chartPoints={[14, 16, 15, 19, 18, 22, 24]}
          delay={0}
        />

        {/* Card 2: Current occupancy */}
        <StatCard
          icon={<Users2 className="w-4 h-4" />}
          title="Current occupancy"
          value={68}
          suffix="%"
          subText="16 / 24 tables"
          chartColor="orange"
          chartPoints={[35, 42, 50, 48, 58, 62, 68]}
          delay={150}
        />

        {/* Card 3: Orders today */}
        <StatCard
          icon={<ShoppingBag className="w-4 h-4" />}
          title="Orders today"
          value={37}
          trendText="+8% compared with yesterday"
          chartColor="green"
          chartPoints={[20, 24, 22, 29, 31, 34, 37]}
          delay={300}
        />

        {/* Card 4: Revenue today */}
        <StatCard
          icon={<Coins className="w-4 h-4" />}
          title="Revenue today"
          value={1240}
          suffix=" TND"
          trendText="+14% compared with yesterday"
          chartColor="orange"
          chartPoints={[600, 750, 700, 920, 1050, 1140, 1240]}
          delay={450}
        />
      </section>

      {/* ─── Main Two-Column Layout (Left: Floor Plan & Activity | Right: Reservations, Orders, Promo) ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Approx 60-65%): Floor Plan + Recent Activity */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
          {/* Restaurant Overview (Architectural Floor Plan Canvas) */}
          <FloorPlanView onOpenFullModal={() => setFloorPlanModalOpen(true)} />

          {/* Recent Activity Cards (4 in a row) */}
          <RecentActivityWidget
            onViewAll={() => alert("All recent activities for today loaded.")}
          />
        </div>

        {/* Right Column (Approx 35-40%): Reservations, Live Orders, Enhance Banner */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
          {/* Today's Reservations Table */}
          <ReservationsWidget
            onAddReservation={() => setReservationModalOpen(true)}
            onViewAll={() => alert("Viewing complete reservations directory.")}
          />

          {/* Live Orders List */}
          <LiveOrdersWidget
            onViewAll={() => alert("Viewing kitchen live orders board.")}
            onSelectOrder={(order) =>
              alert(`Order for ${order.table}: status is ${order.status}`)
            }
          />

          {/* Enhance Your Restaurant Promo Banner */}
          <EnhancePromoCard
            onExplore={() => setFloorPlanModalOpen(true)}
          />
        </div>
      </section>

      {/* ─── Interactive Quick Action Modals ─── */}
      <RestaurantQuickModals
        reservationOpen={reservationModalOpen}
        setReservationOpen={setReservationModalOpen}
        menuItemOpen={menuItemModalOpen}
        setMenuItemOpen={setMenuItemModalOpen}
        tableOpen={tableModalOpen}
        setTableOpen={setTableModalOpen}
        manageOpen={manageModalOpen}
        setManageOpen={setManageModalOpen}
        floorPlanOpen={floorPlanModalOpen}
        setFloorPlanOpen={setFloorPlanModalOpen}
      />
    </div>
  );
}
