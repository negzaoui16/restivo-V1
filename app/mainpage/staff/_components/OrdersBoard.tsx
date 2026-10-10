"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { ORDER_FLOW, actionLabel, itemLabel, ordersIn } from "../_lib/board";
import type { OrderStatus, ServiceOrder } from "../_lib/types";

const TONE: Record<OrderStatus, string> = {
  New: "text-[#8C877D]",
  Preparing: "text-[#C56A2D]",
  Ready: "text-[#2E7D32]",
  Served: "text-[#8C877D]",
};

export function OrdersBoard({
  orders,
  onAdvance,
}: {
  orders: ServiceOrder[];
  onAdvance: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-[#EDE7DC] bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Orders</h2>
        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-[#8C877D]">
          {ORDER_FLOW.map((status) => (
            <span key={status} className={TONE[status]}>
              {status} {ordersIn(orders, status).length}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ORDER_FLOW.map((status) => (
          <OrderColumn key={status} status={status} orders={ordersIn(orders, status)} onAdvance={onAdvance} />
        ))}
      </div>
    </section>
  );
}

function OrderColumn({
  status,
  orders,
  onAdvance,
}: {
  status: OrderStatus;
  orders: ServiceOrder[];
  onAdvance: (id: string) => void;
}) {
  return (
    <div className="min-w-0">
      <p className={`mb-2 flex items-center gap-1.5 text-[12px] font-bold ${TONE[status]}`}>
        <ShieldCheck className="h-3.5 w-3.5" />
        {status}
        <span className="ml-auto font-semibold">{orders.length}</span>
      </p>
      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <OrderTicket key={order.id} order={order} onAdvance={onAdvance} />
        ))}
      </div>
    </div>
  );
}

function OrderTicket({ order, onAdvance }: { order: ServiceOrder; onAdvance: (id: string) => void }) {
  const label = actionLabel(order.status);

  return (
    <article className="rounded-xl border border-[#EDE7DC] bg-[#FFFCF8] p-2.5">
      <div className="flex gap-2.5">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          <Image src={order.image} alt="" fill className="object-cover" sizes="40px" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold">Order #{order.number}</p>
          <p className="text-[11px] text-[#8C877D]">
            {order.table} · {itemLabel(order.items)}
          </p>
          <p className="text-[11px] text-[#A39C91]">{order.minutesAgo} min ago</p>
        </div>
      </div>
      {label ? (
        <button
          type="button"
          onClick={() => onAdvance(order.id)}
          className="mt-2 w-full rounded-lg border border-[#E7D3C4] py-1.5 text-[12px] font-semibold text-[#8A4B32] hover:bg-[#FAF0EA]"
        >
          {label}
        </button>
      ) : (
        <p className="mt-2 text-center text-[12px] font-semibold text-[#8C877D]">Completed</p>
      )}
    </article>
  );
}
