import { useState } from "react";
import { ColumnConfig } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface SamplingConfigProps {
  columns: ColumnConfig[];
  onColumnsChange: (cols: ColumnConfig[]) => void;
  intervalSec: number;
  onIntervalChange: (sec: number) => void;
  durationMin: number | null;
  onDurationChange: (min: number | null) => void;
  disabled: boolean;
}

export function SamplingConfig({
  columns,
  onColumnsChange,
  intervalSec,
  onIntervalChange,
  durationMin,
  onDurationChange,
  disabled,
}: SamplingConfigProps) {
  const addColumn = () => {
    onColumnsChange([
      ...columns,
      { id: crypto.randomUUID(), name: `Kanál ${columns.length + 1}` },
    ]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    onColumnsChange(columns.filter((c) => c.id !== id));
  };

  const renameColumn = (id: string, name: string) => {
    onColumnsChange(columns.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Interval (s)</Label>
          <Input
            type="number"
            min={1}
            value={intervalSec}
            onChange={(e) => onIntervalChange(Math.max(1, Number(e.target.value)))}
            disabled={disabled}
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Doba trvání (min)</Label>
          <Input
            type="number"
            min={0}
            placeholder="∞ Kontinuálně"
            value={durationMin ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onDurationChange(v === "" ? null : Math.max(1, Number(v)));
            }}
            disabled={disabled}
            className="mt-1 font-mono"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Sloupce dat</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addColumn}
            disabled={disabled}
            className="h-7 gap-1 text-xs text-primary hover:text-primary"
          >
            <Plus className="h-3 w-3" /> Přidat
          </Button>
        </div>
        <div className="space-y-2">
          {columns.map((col) => (
            <div key={col.id} className="flex items-center gap-2">
              <Input
                value={col.name}
                onChange={(e) => renameColumn(col.id, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm"
              />
              {columns.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeColumn(col.id)}
                  disabled={disabled}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
