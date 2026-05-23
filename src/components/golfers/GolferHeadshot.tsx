"use client";

import Image from "next/image";
import { useState } from "react";
import { getGolferHeadshotUrl, golferInitials } from "@/lib/golfers/headshots";
import { cn } from "@/lib/utils";

export function GolferHeadshot({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : getGolferHeadshotUrl(name);
  const sizeClass = {
    sm: "size-8 text-[10px]",
    md: "size-10 text-xs",
    lg: "size-14 text-sm",
  }[size];

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[var(--primary)] font-black text-white shadow-sm",
        sizeClass,
        className,
      )}
      title={name}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={size === "lg" ? "56px" : size === "md" ? "40px" : "32px"}
          className="object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        golferInitials(name)
      )}
    </span>
  );
}
