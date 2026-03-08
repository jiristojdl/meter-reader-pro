import { useState, useRef, useCallback, useEffect } from "react";
import { CameraPreview } from "@/components/CameraPreview";
import { DataTable } from "@/components/DataTable";
import { SamplingConfig } from "@/components/SamplingConfig";
import { DataRow, ColumnConfig, exportToCsv } from "@/lib/data";
import { captureFrame, canvasToBase64, performCalibration, performMeasurement } from "@/lib/ocr";
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
import { Play, Square, Trash2, Download, Sun, Moon, Camera, LineChart } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DataChart } from "@/components/DataChart";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const columnsRef = useRef<ColumnConfig[]>([]);
  const { toast } = useToast();

  const [darkMode, setDarkMode] = useState(true);
  const [running, setRunning] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: crypto.randomUUID(), name: "Hodnota" },
  ]);
  const [intervalSec, setIntervalSec] = useState(5);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastRawText, setLastRawText] = useState<string>("");
  const [showChart, setShowChart] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const takeMeasurement = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    setProcessing(true);

    try {
      const canvas = captureFrame(videoRef.current);
      const imageBase64 = canvasToBase64(canvas);
      const result = await performMeasurement(imageBase64, columnsRef.current);

      setLastRawText(result.raw_text || "");

      const newRow: DataRow = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        values: {},
        rawText: result.raw_text || "",
      };

      for (const col of columnsRef.current) {
        const reading = result.readings[col.name];
        if (reading) {
          newRow.values[col.id] = {
            value: reading.value,
            unit: reading.unit || "",
          };
        }
      }

      setRows((prev) => [...prev, newRow]);
    } catch (e: any) {
      console.error("AI OCR error:", e);
      toast({
        title: "Chyba AI rozpoznávání",
        description: e.message || "Nepodařilo se rozpoznat text",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  const startSampling = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      toast({
        title: "Kamera není připravena",
        description: "Počkejte na inicializaci kamery",
        variant: "destructive",
      });
      return;
    }

    // Step 1: Calibration - analyze first frame to create columns
    setCalibrating(true);
    setProcessing(true);

    try {
      const canvas = captureFrame(videoRef.current);
      const imageBase64 = canvasToBase64(canvas);
      const calibResult = await performCalibration(imageBase64);

      if (calibResult.columns.length === 0) {
        toast({
          title: "Žádné hodnoty nenalezeny",
          description: "AI nenašla žádné hodnoty na displeji. Zkuste upravit záběr.",
          variant: "destructive",
        });
        setCalibrating(false);
        setProcessing(false);
        return;
      }

      // Create columns from calibration
      const newColumns: ColumnConfig[] = calibResult.columns.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
      }));
      setColumns(newColumns);
      columnsRef.current = newColumns;

      // Save first measurement
      const firstRow: DataRow = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        values: {},
        rawText: calibResult.raw_text || "",
      };

      for (let i = 0; i < calibResult.columns.length; i++) {
        const col = calibResult.columns[i];
        firstRow.values[newColumns[i].id] = {
          value: col.value,
          unit: col.unit || "",
        };
      }

      setRows((prev) => [...prev, firstRow]);
      setLastRawText(calibResult.raw_text || "");

      toast({
        title: "Kalibrace dokončena",
        description: `Nalezeno ${calibResult.columns.length} hodnot: ${calibResult.columns.map((c) => c.name).join(", ")}`,
      });
    } catch (e: any) {
      console.error("Calibration error:", e);
      toast({
        title: "Chyba kalibrace",
        description: e.message || "Nepodařilo se analyzovat displej",
        variant: "destructive",
      });
      setCalibrating(false);
      setProcessing(false);
      return;
    }

    setCalibrating(false);
    setProcessing(false);

    // Step 2: Start periodic measurements
    setRunning(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (durationMin !== null) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
        if (elapsed >= durationMin) {
          stopSampling();
          return;
        }
      }
      takeMeasurement();
    }, intervalSec * 1000);
  }, [intervalSec, durationMin, takeMeasurement, toast]);

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

        {/* Controls */}
        <div className="flex gap-2">
          {!running && !calibrating ? (
            <Button onClick={startSampling} className="flex-1 gap-2">
              <Play className="h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button onClick={stopSampling} variant="destructive" className="flex-1 gap-2" disabled={calibrating}>
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

        {/* Status indicator */}
        {(calibrating || running || processing) && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-mono">
              {calibrating
                ? "Kalibrace – AI analyzuje displej..."
                : running
                  ? `Měření probíhá... (${rows.length} záznamů)`
                  : ""}
              {processing && !calibrating && " • AI zpracovává snímek..."}
            </span>
          </div>
        )}

        {/* Last raw text from AI */}
        {lastRawText && (
          <div className="rounded-md border border-border bg-muted p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Rozpoznaný text (AI)</p>
            <p className="font-mono text-sm text-foreground">{lastRawText}</p>
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

        {/* Data Table */}
        <DataTable rows={rows} columns={columns} />
      </main>
    </div>
  );
};

export default Index;
