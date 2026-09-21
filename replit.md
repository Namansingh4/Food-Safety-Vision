# Food Safety AI

Food Safety AI screens food package photos with OpenCV preprocessing, OCR, expiry logic, and a trained Random Forest risk model.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/food-safety-ai/` — responsive analysis workspace and methodology page
- `artifacts/api-server/src/routes/food-analysis.ts` — upload, model metadata, and pipeline metadata routes
- `artifacts/api-server/src/food-analysis/food_analyzer.py` — OpenCV, PaddleOCR adapter, field parsing, expiry logic, and scikit-learn model
- `lib/api-spec/openapi.yaml` — source of truth for analysis API contracts

## Architecture decisions

- The frontend uses the generated API client for the multipart upload and metadata queries.
- Image analysis runs in a Python process so the capstone pipeline can use OpenCV, OCR, and scikit-learn directly.
- The Random Forest is trained at runtime from a small labeled feature dataset bundled with the project; probabilities are returned alongside the predicted risk band.
- OCR attempts PaddleOCR first and uses local Tesseract as an offline fallback, while exposing the pipeline in the UI.

## Product

- Upload or drag in one food package image.
- Preprocess the image, extract label text and structured fields, calculate expiry status, classify food category, and estimate low/moderate/high risk with confidence.
- Show raw OCR, preprocessing trace, risk probabilities, extracted-field confidence, model metadata, and an explicit laboratory-confirmation disclaimer.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Python dependencies are managed through the workspace Python module and `pyproject.toml`; keep the PaddleOCR adapter fallback intact for offline demo environments.
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before typechecking the frontend or API.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
