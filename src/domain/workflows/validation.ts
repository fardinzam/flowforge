export type WorkflowValidationErrorCode =
  | "duplicate_node_id"
  | "duplicate_edge_id"
  | "edge_missing_source"
  | "edge_missing_target"
  | "unsupported_node_type"
  | "invalid_trigger_count"
  | "cycle_detected"
  | "unreachable_node";

export type WorkflowValidationError = {
  code: WorkflowValidationErrorCode;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export type WorkflowValidationResult = {
  valid: boolean;
  errors: WorkflowValidationError[];
};
