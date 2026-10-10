"use client";

import { useAuth } from "@/contexts/AuthContext";
import { matchesQuery } from "../_lib/board";
import type { ServiceOrder } from "../_lib/types";
import { AttentionRow } from "./AttentionRow";
import { LiveOrderCard } from "./LiveOrderCard";
import { OrdersBoard } from "./OrdersBoard";
import { QuickStats } from "./QuickStats";
import { SummaryStrip } from "./SummaryStrip";
import { TodayReservations } from "./TodayReservations";
import { DAY_RESERVATIONS } from "../_lib/board";

export function Overview({
  greeting,
  dateLabel,
  orders,
  query,
  onAdvance,
}: {
  greeting: string;
  dateLabel: string;
  orders: ServiceOrder[];
  query: string;
  onAdvance: (id: string) => void;
}) {
  const { user, isReady } = useAuth();
  const name = user?.firstName || user?.displayName;
  const visible = orders.filter((order) => matchesQuery(`${order.number} ${order.table} ${order.status}`, query));
  const featured = visible.find((order) => order.status === "Preparing") ?? visible[0];
  const ready = visible.find((order) => order.status === "Ready");
  const reservations = DAY_RESERVATIONS.filter((row) => matchesQuery(`${row.guest} ${row.table} ${row.time}`, query));

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-[28px]">
              {greeting}{isReady && name ? `, ${name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-[#736D65]">Here&apos;s what needs your attention today.</p>
          </div>
          <p className="rounded-full border border-[#E8E2D7] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6B665E]">
            {dateLabel}
          </p>
        </header>
        <SummaryStrip />
        <AttentionRow featured={featured} ready={ready} onAdvance={onAdvance} />
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-[#EDE7DC] bg-white px-4 py-8 text-sm text-[#8C877D]">
            No orders match that search.
          </p>
        ) : (
          <OrdersBoard orders={visible} onAdvance={onAdvance} />
        )}
      </div>
      <aside className="flex flex-col gap-4">
        <LiveOrderCard order={featured} />
        <QuickStats />
        <TodayReservations rows={reservations} />
      </aside>
    </div>
  );
}
