import { Clock, RefreshCw, Star } from "lucide-react";
import { QUICK_STATS } from "../_lib/board";

const ICONS = { time: Clock, turn: RefreshCw, score: Star } as const;

export function QuickStats() {
  return (
    <section className="rounded-2xl border border-[#EDE7DC] bg-white p-4">
      <h2 className="mb-3 text-[15px] font-bold">Quick stats</h2>
      <ul className="flex flex-col gap-3">
        {QUICK_STATS.map((stat) => {
          const Icon = ICONS[stat.id];
          return (
            <li key={stat.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[12px] text-[#6B665E]">
                <Icon className="h-3.5 w-3.5 text-[#B55234]" />
                {stat.label}
              </span>
              <span className="text-right">
                <span className="block text-[13px] font-bold">{stat.value}</span>
                <span className="block text-[11px] font-semibold text-[#2E7D32]">{stat.delta}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
