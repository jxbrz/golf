import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { organisationMembers, organisations } from "@/db/schema";
import { authenticateUser, getUserById } from "@/lib/mock-data/store";

const SESSION_COOKIE = "majorPicksSession";

export async function getSessionUser() {
  const cookieStore = await cookies();
  return getUserById(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireCurrentUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();
  if (user.role !== "admin" && user.role !== "owner") redirect("/app");
  return user;
}

export async function requirePlatformOwner() {
  const user = await requireCurrentUser();
  if (user.role !== "owner") redirect("/app");
  return user;
}

export async function requirePlatformAdminOrOwner() {
  const user = await requireCurrentUser();
  if (user.role !== "owner" && user.role !== "admin") redirect("/app");
  return user;
}

export async function requireOrganisationAdmin(organisationId: string) {
  const user = await requireCurrentUser();
  if (user.role === "owner" || user.role === "admin") return user;

  const memberships = await getUserOrganisationMemberships(user.id);
  const membership = memberships.find((item) => item.organisation.id === organisationId);
  if (!membership || !["owner", "admin"].includes(membership.membership.role)) redirect("/app");
  return user;
}

export async function getUserOrganisationMemberships(userId: string) {
  if (!process.env.DATABASE_URL) return [];
  try {
    const db = getDb();
    const memberRows = await db
      .select()
      .from(organisationMembers)
      .where(eq(organisationMembers.userId, userId));
    if (memberRows.length === 0) return [];

    const organisationRows = await db
      .select()
      .from(organisations)
      .where(inArray(organisations.id, memberRows.map((member) => member.organisationId)));

    const memberships: Array<{
      membership: (typeof memberRows)[number];
      organisation: (typeof organisationRows)[number];
    }> = [];

    for (const membership of memberRows) {
      const organisation = organisationRows.find((item) => item.id === membership.organisationId);
      if (organisation) memberships.push({ membership, organisation });
    }

    return memberships;
  } catch (error) {
    console.warn("Unable to read organisation memberships.", error);
    return [];
  }
}

export async function createSession(email: string, password: string) {
  const user = authenticateUser(email, password);
  if (!user) return null;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
