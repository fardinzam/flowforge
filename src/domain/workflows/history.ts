import type { WorkflowGraph } from "./types";

export type EditorHistory = {
  readonly past: readonly WorkflowGraph[];
  readonly future: readonly WorkflowGraph[];
};

export function createHistory(): EditorHistory {
  return { past: [], future: [] };
}

export function pushHistory(
  history: EditorHistory,
  graph: WorkflowGraph,
): EditorHistory {
  return { past: [...history.past, graph], future: [] };
}

export function undoHistory(
  history: EditorHistory,
  current: WorkflowGraph,
): { history: EditorHistory; graph: WorkflowGraph } | null {
  if (history.past.length === 0) {
    return null;
  }

  const previous = history.past[history.past.length - 1];
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
    },
    graph: previous,
  };
}

export function redoHistory(
  history: EditorHistory,
  current: WorkflowGraph,
): { history: EditorHistory; graph: WorkflowGraph } | null {
  if (history.future.length === 0) {
    return null;
  }

  const next = history.future[0];
  return {
    history: {
      past: [...history.past, current],
      future: history.future.slice(1),
    },
    graph: next,
  };
}

export function canUndo(history: EditorHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: EditorHistory): boolean {
  return history.future.length > 0;
}
