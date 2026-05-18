import type { Metadata } from "next";
import { InitiativeNetwork } from "@/components/initiatives/initiative-network";
import { getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Right to AI projects",
  description:
    "The Participatory AI Atlas and AI Pluralism Index are projects from The Right to AI."
};

export default async function InitiativesPage() {
  const stats = await getStats();

  return (
    <div className="page-shell space-y-10 py-10 sm:py-14">
      <InitiativeNetwork stats={stats} />
    </div>
  );
}
