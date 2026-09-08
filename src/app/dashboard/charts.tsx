"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/money";

/**
 * The charting code lives here on its own so the dashboard can load it lazily.
 * Recharts is by far the heaviest thing on the page, and keeping it out of the
 * first load means the numbers paint sooner and phones do less work.
 */

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

export function MonthBars({
  data,
  currency,
}: {
  data: { month: string; Spent: number }[];
  currency?: string;
}) {
  return (
    <div className="h-52 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => (v >= 1000 ? v / 1000 + "k" : String(v))}
          />
          <Tooltip
            cursor={{ fill: "var(--accent)", opacity: 0.4 }}
            contentStyle={tooltipStyle}
            formatter={(v: number) => formatMoney(v, currency)}
          />
          <Bar dataKey="Spent" fill="var(--chart-1)" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({
  data,
  currency,
}: {
  data: { name: string; value: number; color: string }[];
  currency?: string;
}) {
  return (
    <div className="h-32 w-32 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={34}
            outerRadius={60}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((c) => (
              <Cell key={c.name} fill={c.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v, currency)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
