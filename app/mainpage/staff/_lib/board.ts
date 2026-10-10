import type { DayReservation, OrderStatus, ServiceOrder } from "./types";

export const VENUE = {
  name: "Maison Olive",
  city: "Tunis, Tunisia",
  image: "/images/restaurant-ambient.jpg",
  open: true,
} as const;

export const SERVICE_SUMMARY = [
  { id: "open", label: "Restaurant open", value: "Open" },
  { id: "reservations", label: "Reservations today", value: "24" },
  { id: "tables", label: "Tables occupied", value: "8" },
  { id: "preparing", label: "Orders preparing", value: "5" },
  { id: "ready", label: "Orders ready", value: "3" },
] as const;

const PLATES = [
  "/images/le-bistrot.jpg",
  "/images/dar-el-marsa.jpg",
  "/images/cafe-des-arts.jpg",
  "/images/le-comptoir.jpg",
  "/images/restaurant-ambient.jpg",
] as const;

function order(
  number: string,
  table: string,
  items: number,
  status: OrderStatus,
  minutesAgo: number,
  plate: number
): ServiceOrder {
  return { id: number, number, table, items, status, minutesAgo, image: PLATES[plate % PLATES.length] };
}

export const SERVICE_ORDERS: ServiceOrder[] = [
  order("1048", "T07", 2, "Preparing", 8, 0),
  order("1052", "T04", 3, "New", 2, 1),
  order("1053", "T06", 2, "New", 4, 2),
  order("1050", "T07", 2, "Preparing", 8, 3),
  order("1049", "T12", 4, "Preparing", 11, 4),
  order("1045", "T03", 2, "Ready", 6, 0),
  order("1047", "T02", 4, "Ready", 15, 1),
  order("1046", "T05", 2, "Ready", 18, 2),
  order("1044", "T01", 2, "Served", 22, 3),
  order("1043", "T08", 3, "Served", 26, 4),
  order("1042", "T11", 2, "Served", 32, 0),
  order("1041", "T09", 1, "Served", 41, 1),
];

export const ARRIVING = {
  guest: "Sarah Ben Ali",
  time: "19:30",
  guests: 4,
  table: "T14",
  arrivingIn: "15 min",
} as const;

export const TABLE_ISSUE = {
  table: "T09",
  when: "Reservation at 20:00",
  state: "Occupied",
  note: "Currently occupied",
} as const;

export const DAY_RESERVATIONS: DayReservation[] = [
  { id: "r1", time: "10:30", guest: "Sami Ben Ali", table: "T04", guests: 2, status: "Confirmed" },
  { id: "r2", time: "12:00", guest: "Sarah", table: "T12", guests: 4, status: "Confirmed" },
  { id: "r3", time: "13:30", guest: "Yasmine", table: "T07", guests: 2, status: "Pending" },
  { id: "r4", time: "19:30", guest: "Ahmed", table: "T14", guests: 2, status: "Confirmed" },
];

export const QUICK_STATS = [
  { id: "time", label: "Average service time", value: "12 min", delta: "-18%" },
  { id: "turn", label: "Table turnover", value: "2.4 / day", delta: "+12%" },
  { id: "score", label: "Customer satisfaction", value: "4.8 / 5", delta: "+0.2" },
] as const;

export const NOTIFICATIONS = [
  { id: "n1", title: "Order #1048 is waiting", detail: "Table T07 · started 8 min ago" },
  { id: "n2", title: "Sarah Ben Ali is arriving", detail: "19:30 · 4 guests · Table T14" },
  { id: "n3", title: "Table T09 is still occupied", detail: "A 20:00 reservation is coming up" },
] as const;

export const ORDER_FLOW: OrderStatus[] = ["New", "Preparing", "Ready", "Served"];

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  New: "Preparing",
  Preparing: "Ready",
  Ready: "Served",
  Served: null,
};

export function nextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status];
}

export function actionLabel(status: OrderStatus): string | null {
  if (status === "New") return "Start preparing";
  if (status === "Preparing") return "Mark ready";
  if (status === "Ready") return "Mark served";
  return null;
}

export function ordersIn(orders: ServiceOrder[], status: OrderStatus): ServiceOrder[] {
  return orders.filter((order) => order.status === status);
}

export function itemLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function matchesQuery(text: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return needle.length === 0 || text.toLowerCase().includes(needle);
}
