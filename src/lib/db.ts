/**
 * Data access layer
 * DS Therapeutics Explorer
 *
 * Reads from interventions.cleaned.json instead of SQLite
 * for Vercel deployment compatibility.
 */

import fs from "fs";
import path from "path";
import type { Intervention } from "./types";

let cached: Intervention[] | null = null;

export function getAllRows(): Intervention[] {
  if (cached) return cached;
  const filePath = path.join(
    process.cwd(),
    "data",
    "interventions.cleaned.json"
  );
  const raw = fs.readFileSync(filePath, "utf-8");
  cached = JSON.parse(raw) as Intervention[];
  return cached;
}

/**
 * Type guard for checking if a value is present (not null, undefined, or "NA")
 * Per schema.json ingestion_notes: "NA" is a sentinel for "not reported / not applicable"
 */
export function isPresent<T>(v: T | "NA" | null | undefined): v is T {
  return v != null && v !== "NA";
}
