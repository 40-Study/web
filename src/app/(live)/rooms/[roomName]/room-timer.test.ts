import { describe, expect, it } from 'vitest';
import { resolveTimerRestartDuration } from './room-timer';

describe('resolveTimerRestartDuration', () => {
  it('uses the latest timer total when restart has no duration', () => {
    expect(resolveTimerRestartDuration(undefined, 90)).toBe(90);
    expect(resolveTimerRestartDuration(undefined, 120)).toBe(120);
  });

  it('prefers an explicit positive restart duration', () => {
    expect(resolveTimerRestartDuration(30, 120)).toBe(30);
    expect(resolveTimerRestartDuration(0, 120)).toBe(120);
  });
});
