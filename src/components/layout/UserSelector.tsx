"use client";

import { useTransition } from "react";
import { setMockUserAction } from "@/app/actions";
import type { User } from "@/lib/types";

export function UserSelector({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [, startTransition] = useTransition();

  return (
    <form action={setMockUserAction}>
      <select
        name="userId"
        defaultValue={currentUserId}
        className="h-10 max-w-36 rounded-md border border-border bg-surface px-2 text-sm font-semibold"
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (form) startTransition(() => form.requestSubmit());
        }}
      >
        {users.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </form>
  );
}
