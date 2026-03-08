import { ColumnConfig } from "./data";
import { supabase } from "@/integrations/supabase/client";

export interface AiOcrResult {
  readings: Record<string, { value: string; unit: string }>;
  raw_text: string;
}

export function captureFrame(
  video: HTMLVideoElement,
  regionWidth = 480,
  regionHeight = 160
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = regionWidth;
  canvas.height = regionHeight;
  const ctx = canvas.getContext("2d")!;

  const sx = Math.max(0, (video.videoWidth - regionWidth) / 2);
  const sy = Math.max(0, (video.videoHeight - regionHeight) / 2);
  const sw = Math.min(regionWidth, video.videoWidth);
  const sh = Math.min(regionHeight, video.videoHeight);

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, regionWidth, regionHeight);
  return canvas;
}

export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png").split(",")[1];
}

export async function performAiOcr(
  imageBase64: string,
  columns: ColumnConfig[]
): Promise<AiOcrResult> {
  const { data, error } = await supabase.functions.invoke("ai-ocr", {
    body: { imageBase64, columns },
  });

  if (error) {
    throw new Error(error.message || "AI OCR failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AiOcrResult;
}
