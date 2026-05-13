import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  if (user.role !== "admin") redirect("/");
  return user;
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
