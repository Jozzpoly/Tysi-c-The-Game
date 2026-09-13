import { describe, expect, it } from 'vitest';
import {
  computeHandInsertionPreview,
  estimateHandStep,
  fractionalInsertionPosition,
} from '../src/presentation/tactileHandLayout.js';

const CENTERS = [100, 160, 220, 280, 340];

describe('tactile hand layout', () => {
  it('maps held-card center continuously across the hand axis', () => {
    expect(estimateHandStep(CENTERS)).toBe(60);
    expect(fractionalInsertionPosition(100, CENTERS)).toBe(0);
    expect(fractionalInsertionPosition(130, CENTERS)).toBeCloseTo(0.5);
    expect(fractionalInsertionPosition(250, CENTERS)).toBeCloseTo(2.5);
    expect(fractionalInsertionPosition(999, CENTERS)).toBe(4);
  });

  it('opens a moving gap to the right before logical reorder', () => {
    const preview = computeHandInsertionPreview({ sourceIndex: 0, heldCenterX: 250, centers: CENTERS });
    expect(preview.position).toBeCloseTo(2.5);
    expect(preview.targetIndex).toBe(3);
    expect(preview.shiftsPx[0]).toBe(0);
    expect(preview.shiftsPx[1]).toBe(-60);
    expect(preview.shiftsPx[2]).toBe(-60);
    expect(preview.shiftsPx[3]).toBe(-30);
    expect(preview.shiftsPx[4]).toBe(0);
  });

  it('opens a moving gap to the left before logical reorder', () => {
    const preview = computeHandInsertionPreview({ sourceIndex: 4, heldCenterX: 190, centers: CENTERS });
    expect(preview.position).toBeCloseTo(1.5);
    expect(preview.targetIndex).toBe(2);
    expect(preview.shiftsPx[0]).toBe(0);
    expect(preview.shiftsPx[1]).toBe(30);
    expect(preview.shiftsPx[2]).toBe(60);
    expect(preview.shiftsPx[3]).toBe(60);
    expect(preview.shiftsPx[4]).toBe(0);
  });

  it('does not move neighbors while held card remains at its source', () => {
    const preview = computeHandInsertionPreview({ sourceIndex: 2, heldCenterX: 220, centers: CENTERS });
    expect(preview.targetIndex).toBe(2);
    expect(preview.shiftsPx).toEqual([0, 0, 0, 0, 0]);
  });
});
