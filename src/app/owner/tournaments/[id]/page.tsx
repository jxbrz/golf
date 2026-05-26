import { redirect } from "next/navigation";
import { requirePlatformAdminOrOwner } from "@/lib/auth";

export default async function OwnerTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdminOrOwner();
  const { id } = await params;
  redirect(`/admin/tournaments/${id}`);
}
