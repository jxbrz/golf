import { redirect } from "next/navigation";

export default function LegacyOrganisationRequestsPage() {
  redirect("/owner/organisation-requests");
}
