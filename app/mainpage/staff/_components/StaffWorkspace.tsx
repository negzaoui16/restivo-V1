"use client";

import { DAY_RESERVATIONS, matchesQuery } from "../_lib/board";
import { useServiceBoard } from "../_lib/use-service-board";
import { useStaffChrome } from "../_context/staff-chrome";
import { OrdersBoard } from "./OrdersBoard";
import { Overview } from "./Overview";
import { StaffSection } from "./StaffSection";
import { TodayReservations } from "./TodayReservations";

export function StaffWorkspace({ greeting, dateLabel }: { greeting: string; dateLabel: string }) {
  const { section, search } = useStaffChrome();
  const { orders, advance } = useServiceBoard();
  const visibleOrders = orders.filter((order) => matchesQuery(`${order.number} ${order.table} ${order.status}`, search));

  if (section === "overview") {
    return <Overview greeting={greeting} dateLabel={dateLabel} orders={orders} query={search} onAdvance={advance} />;
  }

  if (section === "orders") {
    return visibleOrders.length === 0 ? (
      <EmptySearch />
    ) : (
      <OrdersBoard orders={visibleOrders} onAdvance={advance} />
    );
  }

  if (section === "reservations") {
    const rows = DAY_RESERVATIONS.filter((row) => matchesQuery(`${row.guest} ${row.table}`, search));
    return <TodayReservations rows={rows} />;
  }

  return <StaffSection section={section} />;
}

function EmptySearch() {
  return <p className="rounded-2xl border border-[#EDE7DC] bg-white px-4 py-8 text-sm text-[#8C877D]">No orders match that search.</p>;
}
