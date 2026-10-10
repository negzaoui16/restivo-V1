import { Armchair, UtensilsCrossed } from "lucide-react";
import { NOTIFICATIONS, TABLE_ISSUE } from "../_lib/board";
import type { StaffSectionId } from "../_lib/types";

const COPY: Partial<Record<StaffSectionId, { title: string; body: string }>> = {
  tables: {
    title: `Table ${TABLE_ISSUE.table}`,
    body: `${TABLE_ISSUE.when}. The table is ${TABLE_ISSUE.state.toLowerCase()}, so the next party cannot be seated yet.`,
  },
  menu: {
    title: "Menu",
    body: "The dishes you can send from the pass will be listed here.",
  },
};

export function StaffSection({ section }: { section: StaffSectionId }) {
  if (section === "notifications") {
    return (
      <section className="rounded-2xl border border-[#EDE7DC] bg-white p-5">
        <h1 className="text-xl font-extrabold">Notifications</h1>
        <ul className="mt-4 flex flex-col gap-2">
          {NOTIFICATIONS.map((item) => (
            <li key={item.id} className="rounded-xl bg-[#FAF7F2] px-3 py-3">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-0.5 text-[12px] text-[#8C877D]">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const note = COPY[section];
  const Icon = section === "tables" ? Armchair : UtensilsCrossed;

  return (
    <section className="rounded-2xl border border-[#EDE7DC] bg-white px-6 py-16 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0EA] text-[#B55234]">
        <Icon className="h-5 w-5" />
      </span>
      <h1 className="text-xl font-extrabold">{note?.title ?? "Staff"}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#736D65]">{note?.body}</p>
    </section>
  );
}
