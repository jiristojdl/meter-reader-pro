import Tesseract from "tesseract.js";

const UNIT_PATTERNS = /(V|A|°C|℃|kg|mA|kV|mV|W|kW|Ω|kΩ|MΩ|Hz|kHz|MHz|%)\s*$/i;

export interface OcrResult {
  raw: string;
  value: string;
  unit: string;
}

export async function performOcr(canvas: HTMLCanvasElement): Promise<OcrResult> {
  const { data } = await Tesseract.recognize(canvas, "eng", {
    logger: () => {},
  });

  const raw = data.text.trim();
  // Try to extract a number and unit
  // Clean OCR artifacts, keep digits, dots, minus, and letters for unit
  const cleaned = raw.replace(/[^0-9.\-a-zA-Z°℃%Ω]/g, " ").trim();

  // Find the best numeric match
  const numMatch = cleaned.match(/-?\d+\.?\d*/);
  const value = numMatch ? numMatch[0] : raw;

  // Try to find unit after the number
  const afterNum = numMatch ? cleaned.slice((numMatch.index ?? 0) + numMatch[0].length).trim() : "";
  const unitMatch = afterNum.match(UNIT_PATTERNS);
  const unit = unitMatch ? unitMatch[1] : "";

  return { raw, value, unit };
}

export function captureFrame(
  video: HTMLVideoElement,
  regionWidth = 320,
  regionHeight = 80
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = regionWidth;
  canvas.height = regionHeight;
  const ctx = canvas.getContext("2d")!;

  // Capture from center of video
  const sx = (video.videoWidth - regionWidth) / 2;
  const sy = (video.videoHeight - regionHeight) / 2;

  ctx.drawImage(video, sx, sy, regionWidth, regionHeight, 0, 0, regionWidth, regionHeight);
  return canvas;
}
