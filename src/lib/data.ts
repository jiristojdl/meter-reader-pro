import { format } from "date-fns";

export interface DataRow {
  id: string;
  timestamp: Date;
  values: Record<string, { value: string; unit: string }>;
  rawText?: string;
}

export interface ColumnConfig {
  id: string;
  name: string;
}

export function exportToCsv(rows: DataRow[], columns: ColumnConfig[]): void {
  const header = ["Timestamp", ...columns.map((c) => `${c.name} (Value)`), ...columns.map((c) => `${c.name} (Unit)`), "Raw Text"];
  const csvRows = [header.join(",")];

  for (const row of rows) {
    const ts = format(row.timestamp, "yyyy-MM-dd HH:mm:ss");
    const values = columns.map((c) => row.values[c.id]?.value ?? "");
    const units = columns.map((c) => row.values[c.id]?.unit ?? "");
    csvRows.push([ts, ...values, ...units].join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `display-reader-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
