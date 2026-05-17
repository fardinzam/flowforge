// Ensure env is validated at startup before any DB connections
import "./worker-env";

import { getPool } from "@/server/db/pool";

import { claimRun } from "./claim-run";
import { executeRun } from "./execution/execute-run";
import { reclaimStalledRuns } from "./reclaim-stalled-runs";

const POLL_INTERVAL_MS = 2_000;
const RECLAIM_INTERVAL_MS = 60_000;

async function poll(): Promise<void> {
  try {
    const db = getPool();
    const run = await claimRun(db);
    if (run) {
      await executeRun(run, db);
    }
  } catch (err) {
    console.error("[worker] Unhandled error in poll:", err);
  }
}

async function reclaim(): Promise<void> {
  try {
    const n = await reclaimStalledRuns(getPool());
    if (n > 0) console.log(`[worker] Reclaimed ${n} stalled run(s)`);
  } catch (err) {
    console.error("[worker] Error reclaiming stalled runs:", err);
  }
}

const timer = setInterval(() => {
  void poll();
}, POLL_INTERVAL_MS);
const reclaimTimer = setInterval(() => {
  void reclaim();
}, RECLAIM_INTERVAL_MS);

process.on("SIGINT", () => {
  clearInterval(timer);
  clearInterval(reclaimTimer);
  process.exit(0);
});
process.on("SIGTERM", () => {
  clearInterval(timer);
  clearInterval(reclaimTimer);
  process.exit(0);
});

console.log("[worker] Started — polling every", POLL_INTERVAL_MS, "ms");
