import { Calendar } from "lucide-react";
import { SectionEmptyState } from "../_components/SectionEmptyState";

export default function ReservationsPage() {
  return (
    <SectionEmptyState
      icon={<Calendar className="w-6 h-6" />}
      title="Reservations"
      description="Your upcoming and past bookings will live here. The sidebar stays put while you move around."
    />
  );
}
