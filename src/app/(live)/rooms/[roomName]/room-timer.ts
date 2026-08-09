export function resolveTimerRestartDuration(duration: unknown, currentTotal: number): number {
  return typeof duration === 'number' && duration > 0 ? duration : currentTotal;
}
