"use client";

import { Armchair, Bell, CalendarDays, ShieldCheck } from "lucide-react";
import { ARRIVING, TABLE_ISSUE, actionLabel, itemLabel } from "../_lib/board";
import type { ServiceOrder } from "../_lib/types";

const CARD = "flex flex-col justify-between rounded-2xl border p-3.5";
const BUTTON = "mt-3 inline-flex w-fit items-center rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold";

export function AttentionRow({
  featured,
  ready,
  onAdvance,
}: {
  featured: ServiceOrder | undefined;
  ready: ServiceOrder | undefined;
  onAdvance: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <Bell className="h-4 w-4 text-[#B55234]" />
          Needs your attention
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {featured && (
          <article className={`${CARD} border-[#F0E4D8] bg-[#FBF7F2]`}>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#C56A2D]">
                <Bell className="h-3.5 w-3.5" /> Preparing
              </p>
              <h3 className="mt-2 text-sm font-bold">Order #{featured.number}</h3>
              <p className="mt-1 text-[12px] text-[#6B665E]">Table {featured.table} · {itemLabel(featured.items)}</p>
              <p className="mt-1 text-[12px] text-[#8C877D]">Started {featured.minutesAgo} min ago</p>
            </div>
            <button type="button" onClick={() => onAdvance(featured.id)} className={`${BUTTON} border-[#E7D3C4] text-[#8A4B32]`}>
              {actionLabel(featured.status) ?? "View order"}
            </button>
          </article>
        )}
        <article className={`${CARD} border-[#EDE7DC] bg-white`}>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C877D]">
              <CalendarDays className="h-3.5 w-3.5" /> Reservation arriving
            </p>
            <h3 className="mt-2 text-sm font-bold">{ARRIVING.guest}</h3>
            <p className="mt-1 text-[12px] text-[#6B665E]">{ARRIVING.time} · {ARRIVING.guests} guests</p>
            <p className="mt-1 text-[12px] text-[#8C877D]">Table {ARRIVING.table} · Arriving in {ARRIVING.arrivingIn}</p>
          </div>
          <span className={`${BUTTON} border-[#E7D3C4] text-[#8A4B32]`}>View reservation</span>
        </article>
        {ready && (
          <article className={`${CARD} border-[#D7EBD9] bg-[#F4FAF5]`}>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2E7D32]">
                <ShieldCheck className="h-3.5 w-3.5" /> Order ready
              </p>
              <h3 className="mt-2 text-sm font-bold">Order #{ready.number}</h3>
              <p className="mt-1 text-[12px] text-[#6B665E]">Table {ready.table} · {itemLabel(ready.items)}</p>
              <p className="mt-1 text-[12px] text-[#2E7D32]">Ready for pickup</p>
            </div>
            <button type="button" onClick={() => onAdvance(ready.id)} className={`${BUTTON} border-[#B7D7BA] text-[#2E7D32]`}>
              Mark served
            </button>
          </article>
        )}
        <article className={`${CARD} border-[#F0D9D4] bg-[#FDF6F5]`}>
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#C0392B]">
              <Armchair className="h-3.5 w-3.5" /> Table issue
            </p>
            <h3 className="mt-2 text-sm font-bold">Table {TABLE_ISSUE.table}</h3>
            <p className="mt-1 text-[12px] text-[#6B665E]">{TABLE_ISSUE.when}</p>
            <p className="mt-1 text-[12px] text-[#C0392B]">{TABLE_ISSUE.state} · {TABLE_ISSUE.note}</p>
          </div>
          <span className={`${BUTTON} border-[#E7C8C2] text-[#8A4B32]`}>View table</span>
        </article>
      </div>
    </section>
  );
}
