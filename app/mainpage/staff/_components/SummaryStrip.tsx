import { Armchair, CalendarDays, ChefHat, Clock, ConciergeBell } from "lucide-react";
import { SERVICE_SUMMARY } from "../_lib/board";

const ICONS = {
  open: ConciergeBell,
  reservations: CalendarDays,
  tables: Armchair,
  preparing: ChefHat,
  ready: Clock,
} as const;

export function SummaryStrip() {
  return (
    <section className="grid grid-cols-2 gap-2 rounded-2xl border border-[#EDE7DC] bg-white p-3 sm:grid-cols-3 xl:grid-cols-5">
      {SERVICE_SUMMARY.map((item) => {
        const Icon = ICONS[item.id];
        return (
          <div key={item.id} className="flex items-center gap-2.5 px-1 py-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF7F2] text-[#B55234]">
              {item.id === "open" ? <span className="h-2.5 w-2.5 rounded-full bg-[#2E7D32]" /> : <Icon className="h-4 w-4" />}
            </span>
            <span>
              {item.id === "open" ? (
                <span className="block text-sm font-bold text-[#1A1A1A]">Restaurant open</span>
              ) : (
                <>
                  <span className="block text-sm font-extrabold text-[#1A1A1A]">{item.value}</span>
                  <span className="block text-[11px] text-[#8C877D]">{item.label}</span>
                </>
              )}
            </span>
          </div>
        );
      })}
    </section>
  );
}
