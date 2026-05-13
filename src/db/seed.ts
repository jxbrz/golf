import { getStore } from "@/lib/mock-data/store";

const store = getStore();

console.log(
  `Seed preview ready: ${store.tournaments.length} tournament, ${store.users.length} users, ${store.golfers.length} golfers.`,
);
console.log("Use DATABASE_URL plus drizzle-kit migrate when wiring this seed into Neon.");
