import { useState, useRef, useCallback, useEffect } from "react";
import { CameraPreview } from "@/components/CameraPreview";
import { DataTable } from "@/components/DataTable";
import { SamplingConfig } from "@/components/SamplingConfig";
import { DataRow, ColumnConfig, exportToCsv } from "@/lib/data";
import { performOcr, captureFrame } from "@/lib/ocr";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Play, Square, Trash2, Download, Sun, Moon, Camera } from "lucide-react";

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const [darkMode, setDarkMode] = useState(true);
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: crypto.randomUUID(), name: "Hodnota" },
  ]);
  const [intervalSec, setIntervalSec] = useState(5);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Init dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const takeMeasurement = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    setProcessing(true);

    try {
      const canvas = captureFrame(videoRef.current);
      const result = await performOcr(canvas);

      const newRow: DataRow = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        values: {},
      };

      // For now, assign OCR result to the first column
      if (columns.length > 0) {
        newRow.values[columns[0].id] = {
          value: result.value,
          unit: result.unit,
        };
      }

      setRows((prev) => [...prev, newRow]);
    } catch (e) {
      console.error("OCR error:", e);
    } finally {
      setProcessing(false);
    }
  }, [columns]);

  const startSampling = useCallback(() => {
    setRunning(true);
    startTimeRef.current = Date.now();

    // Take first measurement immediately
    takeMeasurement();

    timerRef.current = setInterval(() => {
      // Check duration
      if (durationMin !== null) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
        if (elapsed >= durationMin) {
          stopSampling();
          return;
        }
      }
      takeMeasurement();
    }, intervalSec * 1000);
  }, [intervalSec, durationMin, takeMeasurement]);

  const stopSampling = useCallback(() => {
    setRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h1 className="font-mono text-sm font-bold tracking-tight text-foreground">
              Opisovač Displeje
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="h-8 w-8"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container flex-1 space-y-4 py-4">
        {/* Camera */}
        <CameraPreview videoRef={videoRef} onSnapshot={() => null} />

        {/* Status indicator */}
        {running && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-mono">
              Měření probíhá... ({rows.length} záznamů)
              {processing && " • Zpracování..."}
            </span>
          </div>
        )}

        {/* Config */}
        <SamplingConfig
          columns={columns}
          onColumnsChange={setColumns}
          intervalSec={intervalSec}
          onIntervalChange={setIntervalSec}
          durationMin={durationMin}
          onDurationChange={setDurationMin}
          disabled={running}
        />

        {/* Controls */}
        <div className="flex gap-2">
          {!running ? (
            <Button onClick={startSampling} className="flex-1 gap-2">
              <Play className="h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={stopSampling} variant="destructive" className="flex-1 gap-2">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => exportToCsv(rows, columns)}
            disabled={rows.length === 0}
          >
            <Download className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={rows.length === 0 || running}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Smazat všechna data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tato akce je nevratná. Všechna naměřená data budou ztracena.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                <AlertDialogAction onClick={() => setRows([])}>
                  Smazat
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Data Table */}
        <DataTable rows={rows} columns={columns} />
      </main>
    </div>
  );
};

export default Index;
