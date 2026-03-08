import { useMemo, useState } from "react";
import { DataRow, ColumnConfig } from "@/lib/data";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DataChartProps {
  rows: DataRow[];
  columns: ColumnConfig[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(262 83% 58%)",
  "hsl(190 90% 50%)",
  "hsl(340 82% 52%)",
  "hsl(25 95% 53%)",
];

export function DataChart({ rows, columns }: DataChartProps) {
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    () => new Set(columns.map((c) => c.id))
  );
  const [rightAxisCols, setRightAxisCols] = useState<Set<string>>(new Set());

  useMemo(() => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      for (const col of columns) {
        if (!prev.has(col.id)) next.add(col.id);
      }
      return next;
    });
  }, [columns]);

  const chartData = useMemo(() => {
    return rows.map((row) => {
      const point: Record<string, string | number> = {
        time: format(row.timestamp, "HH:mm:ss"),
      };
      for (const col of columns) {
        const val = row.values[col.id]?.value;
        if (val !== undefined) {
          const num = parseFloat(val);
          point[col.id] = isNaN(num) ? 0 : num;
        }
      }
      return point;
    });
  }, [rows, columns]);

  const toggleCol = (id: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRightAxis = (id: string) => {
    setRightAxisCols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasRightAxis = useMemo(() => {
    return columns.some((col) => rightAxisCols.has(col.id) && visibleCols.has(col.id));
  }, [columns, rightAxisCols, visibleCols]);

  if (rows.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
        Žádná data pro zobrazení grafu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {columns.map((col, i) => {
          const isFirst = i === 0;
          const isVisible = visibleCols.has(col.id);
          const isRight = rightAxisCols.has(col.id);
          return (
            <div key={col.id} className="flex items-center gap-1.5">
              <Checkbox
                id={`chart-col-${col.id}`}
                checked={isVisible}
                onCheckedChange={() => toggleCol(col.id)}
              />
              <Label
                htmlFor={`chart-col-${col.id}`}
                className="cursor-pointer text-xs font-mono"
                style={{ color: COLORS[i % COLORS.length] }}
              >
                {col.name}
              </Label>
              {!isFirst && isVisible && (
                <button
                  onClick={() => toggleRightAxis(col.id)}
                  className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium border transition-colors ${
                    isRight
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                  }`}
                  title={isRight ? "Přesunout na levou osu Y" : "Přesunout na pravou osu Y"}
                >
                  {isRight ? "R" : "L"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-[300px] rounded-lg border border-border bg-card p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              domain={["auto", "auto"]}
            />
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
                domain={["auto", "auto"]}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
            />
            {columns.map((col, i) =>
              visibleCols.has(col.id) ? (
                <Line
                  key={col.id}
                  type="monotone"
                  dataKey={col.id}
                  name={col.name}
                  yAxisId={rightAxisCols.has(col.id) ? "right" : "left"}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ) : null
            )}
            {chartData.length > 5 && (
              <Brush
                dataKey="time"
                height={25}
                stroke="hsl(var(--primary))"
                fill="hsl(var(--muted))"
                travellerWidth={10}
                tickFormatter={() => ""}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
