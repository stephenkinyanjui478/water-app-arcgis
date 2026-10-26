/**
 * Single-series consumption bar chart (m³ per billing cycle). One hue (water
 * blue), so no legend — the heading names the series. Thin bars with 4px rounded
 * data-ends anchored to the baseline, a recessive y grid, and a per-bar hover
 * tooltip. Light-mode only, matching the app's committed look.
 */
import { useState } from "react";
import type { ConsumptionPoint } from "@/lib/types";
import { num } from "@/lib/format";
import EmptyState from "@/components/EmptyState";

const SERIES = "#2a78d6";
const MUTED = "#898781";
const GRID = "#e1e0d9";
const BASELINE = "#c3c2b7";

export default function ConsumptionChart({ points }: { points: ConsumptionPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!points.length) {
    return (
      <EmptyState
        title="No consumption data yet"
        message="Meter readings will appear here once they have been recorded."
      />
    );
  }

  const padL = 48;
  const padR = 14;
  const padT = 16;
  const padB = 54;
  const H = 280;
  const band = 56; // px per cycle
  const W = Math.max(padL + padR + points.length * band, 320);
  const innerH = H - padT - padB;

  const max = Math.max(...points.map((p) => p.consumption), 1);
  const niceMax = Math.ceil(max / 5) * 5 || 5;
  const yToPx = (v: number) => padT + innerH - (v / niceMax) * innerH;
  const barW = Math.min(30, band * 0.58);

  const ticks = 4;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => (niceMax / ticks) * i);

  return (
    <div style={{ position: "relative", overflowX: "auto" }}>
      <svg width={W} height={H} role="img" aria-label="Consumption per billing cycle" style={{ display: "block" }}>
        {/* y grid + labels */}
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={yToPx(v)} y2={yToPx(v)} stroke={i === 0 ? BASELINE : GRID} strokeWidth={1} />
            <text x={padL - 8} y={yToPx(v) + 4} textAnchor="end" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>
              {num(v)}
            </text>
          </g>
        ))}

        {/* bars */}
        {points.map((p, i) => {
          const cx = padL + i * band + band / 2;
          const x = cx - barW / 2;
          const y = yToPx(p.consumption);
          const h = Math.max(padT + innerH - y, 0);
          const r = Math.min(4, barW / 2, h);
          const active = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* generous hit target */}
              <rect x={padL + i * band} y={padT} width={band} height={innerH} fill="transparent" />
              <path
                d={`M${x},${padT + innerH} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barW - r},${y} Q${x + barW},${y} ${x + barW},${y + r} L${x + barW},${padT + innerH} Z`}
                fill={SERIES}
                opacity={active ? 1 : 0.88}
              />
              <text x={cx} y={H - padB + 18} textAnchor="middle" fontSize={10.5} fill={MUTED}>
                {(p.billingCycle || "").replace(/\s*\d{4}$/, "").slice(0, 10)}
              </text>
            </g>
          );
        })}
      </svg>

      {hover != null ? (
        <div
          style={{
            position: "absolute",
            left: Math.min(padL + hover * band + band / 2, W - 150),
            top: 6,
            transform: "translateX(-50%)",
            background: "#1a1a19",
            color: "#fff",
            borderRadius: 6,
            padding: "6px 9px",
            fontSize: 12,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 600 }}>{points[hover].billingCycle}</div>
          <div>{num(points[hover].consumption)} m³</div>
        </div>
      ) : null}
    </div>
  );
}
