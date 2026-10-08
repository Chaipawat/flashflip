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
      <circle cx="60" cy="60" r="35" fill={`url(#${face})`} />
      <ellipse cx="47" cy="44" rx="11" ry="6" fill="#fff" opacity=".55" transform="rotate(-25 47 44)" />
      <ellipse cx="42" cy="68" rx="7" ry="4.5" fill="#FF8FAB" opacity=".75" />
      <ellipse cx="78" cy="68" rx="7" ry="4.5" fill="#FF8FAB" opacity=".75" />
      <g stroke="#3B2E4A" strokeWidth="3.6" fill="none" strokeLinecap="round">
        <path d="M43 60q6-7 12 0" />
        <path d="M65 60q6-7 12 0" />
        <path d="M53 70q7 7 14 0" />
      </g>
    </svg>
  );
}
