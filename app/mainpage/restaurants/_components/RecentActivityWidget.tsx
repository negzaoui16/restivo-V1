"use client";

import React from "react";
import {
  CalendarDays,
  ShoppingBag,
  Sparkles,
  Star,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  badgeDot: string;
  time: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    icon: <CalendarDays className="w-4 h-4" />,
    iconBg: "bg-[#FAF0EA]",
    iconColor: "text-[#B55234]",
    title: "New reservation",
    subtitle: "Table 12 · 4 guests",
    badgeDot: "bg-[#2E7D32]",
    time: "12:00",
  },
  {
    id: "2",
    icon: <ShoppingBag className="w-4 h-4" />,
    iconBg: "bg-[#FDF0E6]",
    iconColor: "text-[#D96B27]",
    title: "Order updated",
    subtitle: "Table 07 · 2 items",
    badgeDot: "bg-[#D96B27]",
    time: "10:45",
  },
  {
    id: "3",
    icon: <Sparkles className="w-4 h-4" />,
    iconBg: "bg-[#F0F4F8]",
    iconColor: "text-[#4A5568]",
    title: "Table cleaned",
    subtitle: "Table 03",
    badgeDot: "bg-[#718096]",
    time: "10:32",
  },
  {
    id: "4",
    icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />,
    iconBg: "bg-[#FEF9C3]",
    iconColor: "text-amber-600",
    title: "New review",
    subtitle: "5 stars · Sarah",
    badgeDot: "bg-amber-500",
    time: "09:15",
  },
];

interface RecentActivityWidgetProps {
  onViewAll?: () => void;
}

export function RecentActivityWidget({ onViewAll }: RecentActivityWidgetProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-[#1A1A1A]">Recent activity</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#B55234] hover:text-[#943F25] transition-colors flex items-center gap-1 group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ACTIVITIES.map((act) => (
          <div
            key={act.id}
            className="bg-white rounded-2xl border border-[#EDE7DC] hover:border-[#DFD5C4] p-3.5 flex items-center gap-3 transition-all hover:shadow-xs group cursor-pointer"
          >
            {/* Icon Box */}
            <div
              className={`w-9 h-9 rounded-xl ${act.iconBg} ${act.iconColor} flex items-center justify-center shrink-0 border border-black/5 group-hover:scale-105 transition-transform`}
            >
              {act.icon}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1A1A1A] truncate">
                {act.title}
              </p>
              <p className="text-[11px] text-[#7A746B] truncate mt-0.5">
                {act.subtitle}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${act.badgeDot}`} />
                <span className="text-[10px] text-[#8C857B] font-medium">
                  {act.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
