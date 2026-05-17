import type { LogNodeConfig } from "@/domain/workflows/node-configs";

import type { NodeExecutor } from "./index";

export const logExecutor: NodeExecutor = async ({ config, context }) => {
  const { label } = config as LogNodeConfig;
  const prefix = label ? `[LOG] ${label}` : "[LOG]";
  console.log(prefix, JSON.stringify(context.currentPayload));
  return { ok: true, output: context.currentPayload };
};
