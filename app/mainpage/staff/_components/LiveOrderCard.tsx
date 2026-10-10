import Image from "next/image";
import { Check, UtensilsCrossed } from "lucide-react";
import { ORDER_FLOW, VENUE, itemLabel } from "../_lib/board";
import type { ServiceOrder } from "../_lib/types";

export function LiveOrderCard({ order }: { order: ServiceOrder | undefined }) {
  return (
    <section className="rounded-2xl border border-[#EDE7DC] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <UtensilsCrossed className="h-4 w-4 text-[#B55234]" />
          Live orders
        </h2>
        <span className="rounded-full bg-[#EAF5EC] px-2 py-0.5 text-[10px] font-bold text-[#2E7D32]">Live</span>
      </div>
      {order ? <LiveOrder order={order} /> : <p className="text-sm text-[#8C877D]">No orders on the pass.</p>}
    </section>
  );
}

function LiveOrder({ order }: { order: ServiceOrder }) {
  const current = ORDER_FLOW.indexOf(order.status);

  return (
    <div>
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          <Image src={order.image || VENUE.image} alt="" fill className="object-cover" sizes="64px" />
        </div>
        <div>
          <p className="text-sm font-bold">Order #{order.number}</p>
          <p className="text-[12px] text-[#6B665E]">Table {order.table} · {itemLabel(order.items)}</p>
          <p className="mt-1 text-[12px] font-semibold text-[#C56A2D]">{order.status}</p>
          <p className="text-[11px] text-[#8C877D]">Started {order.minutesAgo} min ago</p>
        </div>
      </div>
      <ol className="mt-4 grid grid-cols-4 gap-1">
        {ORDER_FLOW.map((status, index) => (
          <li key={status} className="text-center">
            <StepMark done={index <= current} current={index === current} />
            <span className="mt-1 block text-[10px] font-semibold text-[#8C877D]">{status}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepMark({ done, current }: { done: boolean; current: boolean }) {
  const tone = current ? "bg-[#C56A2D] text-white" : done ? "bg-[#2E7D32] text-white" : "bg-[#F3F0EA] text-[#B5ACA0]";
  return (
    <span className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${tone}`}>
      <Check className="h-3.5 w-3.5" />
    </span>
  );
}
