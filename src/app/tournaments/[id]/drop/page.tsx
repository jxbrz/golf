import { notFound, redirect } from "next/navigation";
import { getTournament } from "@/lib/mock-data/store";

export default async function DropPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = getTournament(id);
  if (!tournament) notFound();

  redirect(`/tournaments/${tournament.id}/team#drop`);
}
