import type { NodeExecutor } from "./index";

export const webhookTriggerExecutor: NodeExecutor = async ({ context }) => {
  return { ok: true, output: context.initialPayload };
};
