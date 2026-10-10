import { DAY_RESERVATIONS } from "../_lib/board";
import type { DayReservation } from "../_lib/types";

export function TodayReservations({ rows = DAY_RESERVATIONS }: { rows?: DayReservation[] }) {
  return (
    <section className="rounded-2xl border border-[#EDE7DC] bg-white p-4">
      <h2 className="mb-3 text-[15px] font-bold">Today&apos;s reservations</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#8C877D]">No reservations match that search.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="w-12 font-semibold text-[#6B665E]">{row.time}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{row.guest}</span>
              <span className="text-[#8C877D]">{row.table}</span>
              <span className="w-4 text-center text-[#8C877D]">{row.guests}</span>
              <StatusPill status={row.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: DayReservation["status"] }) {
  const tone = status === "Confirmed" ? "bg-[#EAF5EC] text-[#2E7D32]" : "bg-[#FDF3E3] text-[#C56A2D]";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>{status}</span>;
}
