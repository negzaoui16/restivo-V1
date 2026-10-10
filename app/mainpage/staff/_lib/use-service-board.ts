"use client";

import { useCallback, useState } from "react";
import { nextStatus, SERVICE_ORDERS } from "./board";
import type { ServiceOrder } from "./types";

export function useServiceBoard() {
  const [orders, setOrders] = useState<ServiceOrder[]>(SERVICE_ORDERS);

  const advance = useCallback((id: string) => {
    setOrders((current) =>
      current.map((order) => {
        const upcoming = nextStatus(order.status);
        if (order.id !== id || !upcoming) return order;
        return { ...order, status: upcoming };
      })
    );
  }, []);

  return { orders, advance };
}
