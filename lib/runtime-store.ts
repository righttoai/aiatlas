import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { RuntimeCollectionName } from "@/lib/types";

const ROOT = process.cwd();

const FILES: Record<RuntimeCollectionName, string> = {
  issues: "issues.json",
  annotations: "annotations.json",
  redactions: "redactions.json",
  submissions: "submissions.json",
  "schema-feedback": "schema-feedback.json"
};

function runtimeFile(name: RuntimeCollectionName) {
  return path.join(ROOT, "data", "runtime", FILES[name]);
}

export async function readRuntimeCollection<T>(name: RuntimeCollectionName) {
  try {
    const file = runtimeFile(name);
    const content = await fs.readFile(file, "utf8");
    return JSON.parse(content) as T[];
  } catch {
    return [] as T[];
  }
}
