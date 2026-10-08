"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function SunMascot({ size = 112, float = false }: { size?: number; float?: boolean }) {
  const id = useId().replaceAll(":", "");
  const face = `${id}-face`;
  const ray = `${id}-ray`;

  return (
    <svg
      className={cn("sun-mascot", float && "sun-float")}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={face} cx="38%" cy="32%" r="72%">
          <stop offset="0" stopColor="#FFF7CF" />
          <stop offset=".5" stopColor="#FFE06E" />
          <stop offset="1" stopColor="#F6B53A" />
        </radialGradient>
        <radialGradient id={ray} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FFEBA3" />
          <stop offset="1" stopColor="#F4AE36" />
        </radialGradient>
      </defs>
      <g fill={`url(#${ray})`}>
        {Array.from({ length: 8 }, (_, index) => (
          <ellipse
            key={index}
            cx="60"
            cy="13"
            rx="7.5"
            ry="11"
            transform={`rotate(${index * 45} 60 60)`}
          />
        ))}
      </g>
      <circle cx="60" cy="60" r="38" fill={`url(#${face})`} />
      <ellipse cx="43" cy="67" rx="7" ry="4" fill="#F7A6A6" opacity=".55" />
      <ellipse cx="77" cy="67" rx="7" ry="4" fill="#F7A6A6" opacity=".55" />
      <path d="M43 54c2.5-3 6.5-3 9 0M68 54c2.5-3 6.5-3 9 0" fill="none" stroke="#674E2D" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 69c6 6 14 6 20 0" fill="none" stroke="#674E2D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="38" cy="39" r="7" fill="#fff" opacity=".35" />
    </svg>
  );
}
