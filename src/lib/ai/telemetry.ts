import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

export type RunMetrics = {
  calls: number;
  repairs: number;
  inputTokens: number;
  outputTokens: number;
  modelMs: number;
};
export const modelRun = new AsyncLocalStorage<RunMetrics>();
export function newMetrics(): RunMetrics {
  return { calls: 0, repairs: 0, inputTokens: 0, outputTokens: 0, modelMs: 0 };
}
export class Timings {
  readonly stages: Record<string, number> = {};
  private started = performance.now();
  async measure<T>(stage: string, work: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await work();
    } finally {
      this.stages[stage] = Math.round(performance.now() - start);
    }
  }
  finish(outcome: string) {
    const metrics = {
      ...this.stages,
      totalMs: Math.round(performance.now() - this.started),
      ...modelRun.getStore(),
      outcome,
    };
    console.info("[analyze:metrics]", JSON.stringify(metrics));
    return metrics;
  }
}
