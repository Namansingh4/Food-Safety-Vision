import express, { Router, type Request } from "express";
import { execFile } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const router = Router();
const execFileAsync = promisify(execFile);

const modelInfo = {
  name: "FoodGuard Risk Classifier",
  algorithm: "Random Forest",
  version: "1.0.0",
  trainedSamples: 24,
  features: [
    "ocr_token_count",
    "ingredient_signal",
    "additive_signal",
    "suspicious_term_signal",
    "expiry_missing",
    "edge_density",
    "color_saturation",
    "category_code",
  ],
  classes: ["low", "moderate", "high"],
  trainingNote:
    "Trained at runtime on a labeled food-label feature dataset bundled with the capstone pipeline. Predictions are screening indicators, not laboratory confirmation.",
};

const pipelineInfo = {
  stages: [
    { id: "preprocess", label: "Preprocess", description: "Resize, denoise, enhance contrast, and correct package perspective with OpenCV.", status: "ready" as const },
    { id: "ocr", label: "OCR extraction", description: "Read product labels with PaddleOCR, with a local Tesseract fallback for offline runs.", status: "ready" as const },
    { id: "fields", label: "Field parsing", description: "Parse dates, batch values, ingredients, MRP, product name, and brand from OCR text.", status: "ready" as const },
    { id: "model", label: "Risk classifier", description: "Run label and image-derived features through the trained Random Forest model.", status: "ready" as const },
    { id: "report", label: "Safety report", description: "Combine model probabilities, expiry logic, indicators, and confidence into an explainable report.", status: "ready" as const },
  ],
  ocrEngine: "PaddleOCR 3.x with Tesseract fallback",
  visionLibrary: "OpenCV",
  classifier: "scikit-learn Random Forest",
};

function getMultipartFile(req: Request) {
  const body = req.body as Buffer;
  if (!Buffer.isBuffer(body)) return null;
  const contentType = req.headers["content-type"] ?? "";
  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i);
  if (!boundaryMatch) return null;
  const marker = Buffer.from(`--${boundaryMatch[1]}`);
  let cursor = 0;
  while (cursor < body.length) {
    const start = body.indexOf(marker, cursor);
    if (start < 0) break;
    const contentStart = body.indexOf(Buffer.from("\r\n\r\n"), start);
    if (contentStart < 0) break;
    const contentEnd = body.indexOf(marker, contentStart + 4);
    if (contentEnd < 0) break;
    const header = body.subarray(start, contentStart).toString("utf8");
    const data = body.subarray(contentStart + 4, Math.max(contentStart + 4, contentEnd - 2));
    const filenameMatch = header.match(/filename="([^"]+)"/i);
    const nameMatch = header.match(/name="([^"]+)"/i);
    if (nameMatch?.[1] === "image" && filenameMatch) {
      return { filename: filenameMatch[1], data };
    }
    cursor = contentEnd;
  }
  return null;
}

router.get("/food/model-info", (_req, res) => {
  res.json(modelInfo);
});

router.get("/food/pipeline-info", (_req, res) => {
  res.json(pipelineInfo);
});

router.post(
  "/food/analyze",
  express.raw({ type: "multipart/form-data", limit: "12mb" }),
  async (req, res) => {
    const uploaded = getMultipartFile(req);
    if (!uploaded || uploaded.data.length < 32) {
      return res.status(400).json({ error: "Upload one readable food package image." });
    }

    const tempPath = path.join(os.tmpdir(), `food-safety-${Date.now()}-${uploaded.filename.replace(/[^a-z0-9._-]/gi, "_")}`);
    const scriptPath = [
      path.resolve(process.cwd(), "src/food-analysis/food_analyzer.py"),
      path.resolve(process.cwd(), "artifacts/api-server/src/food-analysis/food_analyzer.py"),
      path.resolve(import.meta.dirname, "../src/food-analysis/food_analyzer.py"),
    ].find((candidate) => existsSync(candidate));
    if (!scriptPath) {
      return res.status(500).json({ error: "The analysis runtime is not available." });
    }
    try {
      await fs.writeFile(tempPath, uploaded.data);
      const { stdout } = await execFileAsync("python3", [scriptPath, tempPath], {
        env: { ...process.env, PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: "True" },
        maxBuffer: 16 * 1024 * 1024,
      });
      const payload = JSON.parse(stdout.match(/\{[\s\S]*\}\s*$/)?.[0] ?? stdout);
      if (payload.error) {
        throw new Error(payload.error);
      }
      return res.json(payload);
    } catch (error) {
      req.log.error({ err: error }, "food image analysis failed");
      return res.status(500).json({ error: "The analysis pipeline could not process this image. Try a clearer package photo." });
    } finally {
      await fs.rm(tempPath, { force: true }).catch(() => undefined);
    }
  },
);

export default router;