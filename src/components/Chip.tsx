/**
 * Minimal, sharp-cornered status chip. Replaces calcite-chip (whose pill radius
 * is hard-coded in its shadow DOM and can't be flattened via tokens). Colours map
 * to the same good/warning/danger/neutral intents.
 */
import type { HTMLAttributes, ReactNode } from "react";

export type ChipKind = "success" | "warning" | "danger" | "neutral";

const KINDS: Record<ChipKind, { bg: string; fg: string; bd: string }> = {
  success: { bg: "#e7f5ea", fg: "#176b2c", bd: "#a6d7b2" },
  warning: { bg: "#fdf3e0", fg: "#8a5a00", bd: "#f0cf8e" },
  danger: { bg: "#fdeceb", fg: "#a5221a", bd: "#f0b3ae" },
  neutral: { bg: "#eef0f2", fg: "#444a50", bd: "#d5d9dd" },
};

export default function Chip({
  kind = "neutral",
  icon,
  rounded,
  outline,
  children,
  ...rest
}: {
  kind?: ChipKind;
  icon?: string;
  rounded?: boolean;
  outline?: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>) {
  const c = KINDS[kind];
  return (
    <span
      className="chip"
      style={{
        background: outline ? "transparent" : c.bg,
        color: c.fg,
        borderColor: c.bd,
        borderRadius: rounded ? "999px" : undefined,
      }}
      {...rest}
    >
      {icon ? <calcite-icon icon={icon} scale="s" /> : null}
      {children}
    </span>
  );
}
