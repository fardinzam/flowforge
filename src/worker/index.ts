// Ensure env is validated at startup before any DB connections
import "./worker-env";

import { getPool } from "@/server/db/pool";

import { claimRun } from "./claim-run";

const POLL_INTERVAL_MS = 2_000;

async function poll(): Promise<void> {
  try {
    const db = getPool();
    const run = await claimRun(db);
    if (run) {
      console.log("[worker] Claimed run", run.id);
    }
  } catch (err) {
    console.error("[worker] Unhandled error in poll:", err);
  }
}

const timer = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);

process.on("SIGINT", () => { clearInterval(timer); process.exit(0); });
process.on("SIGTERM", () => { clearInterval(timer); process.exit(0); });

console.log("[worker] Started — polling every", POLL_INTERVAL_MS, "ms");
