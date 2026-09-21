---
name: Food analysis runtime
description: Runtime constraints and OCR fallback behavior for the food-safety analysis pipeline.
---

The analysis service should keep PaddleOCR as the primary OCR adapter and retain the Tesseract fallback because OCR model downloads or Paddle runtime support may be unavailable in an offline demo environment.

**Why:** The project needs a runnable capstone demo while still demonstrating the requested PaddleOCR/OpenCV/scikit-learn pipeline.

**How to apply:** Preserve the fallback when changing OCR initialization, and keep the returned engine label honest about which path was used.