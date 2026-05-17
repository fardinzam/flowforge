"use client";

import { useEffect, useState } from "react";

import type { RunSummary } from "@/server/runs/queries";

type RunHistoryListProps = {
  workflowId: string;
};

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRelative(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export function RunHistoryList({ workflowId }: RunHistoryListProps) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/workflows/${workflowId}/history`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: { runs: RunSummary[]; nextCursor: string | null }) => {
        if (!cancelled) {
          setRuns(data.runs);
          setNextCursor(data.nextCursor);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  async function loadMore(cursor: string) {
    setLoading(true);
    const url = `/api/workflows/${workflowId}/history?before=${encodeURIComponent(cursor)}`;
    const res = await fetch(url);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = (await res.json()) as {
      runs: RunSummary[];
      nextCursor: string | null;
    };
    setRuns((prev) => [...prev, ...data.runs]);
    setNextCursor(data.nextCursor);
    setLoading(false);
  }

  if (loading && runs.length === 0) return <p>Loading run history…</p>;
  if (fetchError)
    return <p role="alert">Failed to load run history. Refresh to retry.</p>;
  if (runs.length === 0) return <p>No runs yet.</p>;

  return (
    <section aria-label="Run history">
      <h2>Run history</h2>
      <ul>
        {runs.map((run) => (
          <li key={run.id}>
            <a href={`/runs/${run.id}`}>
              <strong>{run.status}</strong>
              {" · "}
              {formatRelative(run.queuedAt)}
              {" · "}
              {formatDuration(run.startedAt, run.finishedAt)}
              {" · "}
              {run.stepCount} step{run.stepCount !== 1 ? "s" : ""}
              {run.errorSummary ? ` · ${run.errorSummary.slice(0, 60)}` : ""}
            </a>
          </li>
        ))}
      </ul>
      {nextCursor && (
        <button
          disabled={loading}
          onClick={() => void loadMore(nextCursor)}
          type="button"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </section>
  );
}
