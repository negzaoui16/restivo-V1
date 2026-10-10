"use client";

import React from "react";
import { ArrowRight, ChevronRight, Utensils, UtensilsCrossed } from "lucide-react";

export interface OrderItem {
  id: string;
  table: string;
  itemsCount: number;
  status: "Preparing" | "Ready" | "Delivered";
}

const LIVE_ORDERS: OrderItem[] = [
  { id: "1", table: "TABLE 12", itemsCount: 3, status: "Preparing" },
  { id: "2", table: "TABLE 07", itemsCount: 2, status: "Ready" },
  { id: "3", table: "TABLE 18", itemsCount: 4, status: "Preparing" },
  { id: "4", table: "TABLE 03", itemsCount: 1, status: "Delivered" },
  { id: "5", table: "TABLE 09", itemsCount: 3, status: "Ready" },
];

interface LiveOrdersWidgetProps {
  onViewAll?: () => void;
  onSelectOrder?: (order: OrderItem) => void;
}

export function LiveOrdersWidget({ onViewAll, onSelectOrder }: LiveOrdersWidgetProps) {
  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "Preparing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF0E6] text-[#D96B27] border border-[#FADCC7]">
            <UtensilsCrossed className="w-2.5 h-2.5" />
            <span>Preparing</span>
          </span>
        );
      case "Ready":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EC] text-[#2E7D32] border border-[#C8E6C9]">
            <Utensils className="w-2.5 h-2.5" />
            <span>Ready</span>
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F2EFE9] text-[#5C564E] border border-[#E3DDD1]">
            <Utensils className="w-2.5 h-2.5 text-[#736D65]" />
            <span>Delivered</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDE7DC] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-[#1A1A1A]">Live orders</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#B55234] hover:text-[#943F25] transition-colors flex items-center gap-1 group"
        >
          <span>View all orders</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Order rows matching screenshot */}
      <div className="space-y-2">
        {LIVE_ORDERS.map((order) => (
          <div
            key={order.id}
            onClick={() => onSelectOrder?.(order)}
            className="flex items-center justify-between p-2.5 rounded-xl border border-[#EDE7DC] hover:border-[#DFD5C4] hover:bg-[#FAF7F2] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              {/* Table icon box */}
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#ECE7DC] flex items-center justify-center text-[#736D65] group-hover:text-[#B55234] group-hover:border-[#E5DEC9] transition-colors">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 8h16" />
                  <path d="M4 8v10" />
                  <path d="M20 8v10" />
                  <path d="M8 8v4" />
                  <path d="M16 8v4" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-bold text-[#1A1A1A] tracking-wide">
                  {order.table}
                </p>
                <p className="text-[11px] text-[#7A746B]">
                  {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(order.status)}
              <ChevronRight className="w-3.5 h-3.5 text-[#A39C91] group-hover:text-[#1A1A1A] group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
