import { useRef, useEffect, useState, useCallback } from "react";

interface CameraPreviewProps {
  onSnapshot: () => HTMLCanvasElement | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function CameraPreview({ videoRef }: CameraPreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStarted(true);
      }
    } catch (e: any) {
      setError("Kamera není dostupná: " + e.message);
    }
  }, [videoRef]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card">
      {error ? (
        <div className="flex h-48 items-center justify-center p-4 text-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full object-cover"
          style={{ maxHeight: "40vh" }}
        />
      )}
      {started && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-40 rounded border-2 border-primary/70" />
        </div>
      )}
    </div>
  );
}
