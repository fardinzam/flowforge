import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkflowEditor } from "./workflow-editor";
import type { WorkflowGraph } from "@/domain/workflows/types";

const seededGraph: WorkflowGraph = {
  nodes: [
    {
      id: "trigger",
      type: "webhook_trigger",
      position: { x: 48, y: 72 },
      config: {},
    },
    {
      id: "log",
      type: "log",
      position: { x: 360, y: 72 },
      config: { label: "Audit log" },
    },
  ],
  edges: [
    {
      id: "edge_1",
      sourceNodeId: "trigger",
      targetNodeId: "log",
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

describe("WorkflowEditor", () => {
  it("adds nodes from the palette and prevents duplicate webhook triggers", () => {
    render(<WorkflowEditor initialGraph={seededGraph} />);

    fireEvent.click(screen.getByRole("button", { name: "Add transform json" }));
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    fireEvent.click(screen.getByRole("button", { name: "Add http request" }));
    fireEvent.click(screen.getByRole("button", { name: "Add log" }));
    fireEvent.click(screen.getByRole("button", { name: "Add webhook trigger" }));

    expect(screen.getByRole("button", { name: "transform json transform_json_1" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "condition condition_1" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "http request http_request_1" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "log log_1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add webhook trigger" }))
      .toBeDisabled();
    expect(screen.getByRole("button", { name: "webhook trigger trigger" }))
      .toBeInTheDocument();
  });

  it("renders a seeded graph with nodes and edges", () => {
    render(<WorkflowEditor initialGraph={seededGraph} />);

    expect(screen.getByRole("button", { name: "webhook trigger trigger" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "log log" })).toBeInTheDocument();
    expect(screen.getByLabelText("Workflow edges")).toBeInTheDocument();
  });

  it("selects, drags, and deletes a node in memory", () => {
    render(<WorkflowEditor initialGraph={seededGraph} />);

    const logNode = screen.getByRole("button", { name: "log log" });
    fireEvent.pointerDown(logNode, {
      pointerId: 1,
      clientX: 360,
      clientY: 72,
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 420,
      clientY: 120,
    });
    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(screen.getByTestId("node-log")).toHaveAttribute(
      "data-position",
      "420,120",
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete selected" }));

    expect(screen.queryByRole("button", { name: "log log" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("edge trigger to log")).not.toBeInTheDocument();
  });

  it("connects nodes with handles and deletes edges", () => {
    render(<WorkflowEditor initialGraph={{ ...seededGraph, edges: [] }} />);

    fireEvent.click(screen.getByRole("button", { name: "Connect from trigger" }));
    fireEvent.click(screen.getByRole("button", { name: "Connect to log" }));

    expect(screen.getByLabelText("edge trigger to log")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete edge trigger to log" }));

    expect(screen.queryByLabelText("edge trigger to log")).not.toBeInTheDocument();
  });
});
