export type OrderStatus = "New" | "Preparing" | "Ready" | "Served";

export type ServiceOrder = {
  id: string;
  number: string;
  table: string;
  items: number;
  status: OrderStatus;
  minutesAgo: number;
  image: string;
};

export type DayReservation = {
  id: string;
  time: string;
  guest: string;
  table: string;
  guests: number;
  status: "Confirmed" | "Pending";
};

export type StaffSectionId =
  | "overview"
  | "reservations"
  | "tables"
  | "orders"
  | "menu"
  | "notifications";
