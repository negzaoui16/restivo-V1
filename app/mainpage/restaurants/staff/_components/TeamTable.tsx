"use client";

import { profileInitials } from "../../../_lib/profile";
import { sinceLabel } from "../_lib/roster";
import type { RosterMember } from "@/lib/staff/types";

export function TeamTable({ members, empty }: { members: RosterMember[]; empty: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5DFD3] bg-white shadow-sm">
      <header className="border-b border-[#E5DFD3] px-5 py-4">
        <h2 className="text-[15px] font-semibold">On the team</h2>
        <p className="text-[13px] text-[#8C877D]">
          {members.length === 0 ? "No staff yet" : `${members.length} working here`}
        </p>
      </header>
      {members.length === 0 ? (
        <p className="px-5 py-10 text-sm text-[#736D65]">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E5DFD3]">
                <Column>Name</Column>
                <Column>Role</Column>
                <Column>Since</Column>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-[#E5DFD3] last:border-0 hover:bg-[#F9F7F4]">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <Initials name={member.name} />
                      <span className="text-[14px] font-semibold">{member.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-[#FAF0EA] px-2 py-1 text-[12px] font-bold text-[#B55234]">
                      Staff
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[14px] text-[#6B665E]">{sinceLabel(member.since)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Column({ children }: { children: string }) {
  return (
    <th className="px-5 py-3 text-[12px] font-bold tracking-wider text-[#8C877D] uppercase">{children}</th>
  );
}

function Initials({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF0EA] text-[11px] font-bold text-[#B55234]">
      {profileInitials(null, null, name)}
    </span>
  );
}
