"use client";

import React, { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";

export interface ReservationRow {
  id: string;
  time: string;
  guest: string;
  table: string;
  guests: number;
  status: "Confirmed" | "Pending" | "Cancelled";
}

const INITIAL_RESERVATIONS: ReservationRow[] = [
  { id: "1", time: "10:30", guest: "Sami Ben Ali", table: "T04", guests: 2, status: "Confirmed" },
  { id: "2", time: "12:00", guest: "Sarah", table: "T12", guests: 4, status: "Confirmed" },
  { id: "3", time: "13:30", guest: "Yasmine", table: "T07", guests: 2, status: "Pending" },
  { id: "4", time: "19:30", guest: "Ahmed", table: "T14", guests: 2, status: "Confirmed" },
];

interface ReservationsWidgetProps {
  onAddReservation?: () => void;
  onViewAll?: () => void;
}

export function ReservationsWidget({
  onAddReservation,
  onViewAll,
}: ReservationsWidgetProps) {
  const [reservations, setReservations] = useState<ReservationRow[]>(INITIAL_RESERVATIONS);

  return (
    <div className="bg-white rounded-2xl border border-[#EDE7DC] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header matching image: Today's reservations + View all reservations -> */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base font-bold text-[#1A1A1A]">
          Today&apos;s reservations
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#B55234] hover:text-[#943F25] transition-colors flex items-center gap-1 group"
        >
          <span>View all reservations</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left text-xs min-w-[320px]">
          <thead>
            <tr className="border-b border-[#ECE7DC] text-[#8C8479] font-medium">
              <th className="pb-2.5 font-medium">Time</th>
              <th className="pb-2.5 font-medium">Guest</th>
              <th className="pb-2.5 font-medium">Table</th>
              <th className="pb-2.5 font-medium">Guests</th>
              <th className="pb-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4EFEB]">
            {reservations.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-[#FAF7F2]/80 transition-colors group cursor-pointer"
              >
                <td className="py-2.5 font-semibold text-[#1A1A1A]">{row.time}</td>
                <td className="py-2.5 font-medium text-[#2E2A25]">{row.guest}</td>
                <td className="py-2.5 text-[#736D65]">{row.table}</td>
                <td className="py-2.5 text-[#736D65]">{row.guests}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      row.status === "Confirmed"
                        ? "bg-[#EAF5EC] text-[#2E7D32] border border-[#C8E6C9]"
                        : "bg-[#FDF0E6] text-[#D96B27] border border-[#FADCC7]"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
