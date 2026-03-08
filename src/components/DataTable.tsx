import { DataRow, ColumnConfig } from "@/lib/data";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps {
  rows: DataRow[];
  columns: ColumnConfig[];
}

export function DataTable({ rows, columns }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
        Zatím žádná data. Stiskněte Start pro zahájení měření.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[40vh] rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface hover:bg-surface">
            <TableHead className="font-mono text-xs text-muted-foreground">Čas</TableHead>
            {columns.map((col) => (
              <TableHead key={col.id} className="font-mono text-xs text-muted-foreground">
                {col.name}
              </TableHead>
            ))}
            <TableHead className="font-mono text-xs text-muted-foreground">
              Surová data
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...rows].reverse().map((row) => (
            <TableRow key={row.id} className="font-mono text-sm">
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {format(row.timestamp, "HH:mm:ss")}
              </TableCell>
              {columns.map((col) => {
                const v = row.values[col.id];
                return (
                  <TableCell key={col.id}>
                    <span className="text-foreground">{v?.value ?? "—"}</span>
                    {v?.unit && (
                      <span className="ml-1 text-xs text-primary">{v.unit}</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
