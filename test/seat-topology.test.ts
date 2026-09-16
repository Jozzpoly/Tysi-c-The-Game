import { describe, expect, it } from 'vitest';
import { opponentSeatsFromViewer, seatPositionFromViewer } from '../src/presentation/seatTopology.js';

describe('viewer-relative seat topology', () => {
  it('keeps seat 0 perspective compatible with the current host layout', () => {
    expect(opponentSeatsFromViewer(0)).toEqual([1, 2]);
    expect(seatPositionFromViewer(0, 0)).toBe('self');
    expect(seatPositionFromViewer(0, 1)).toBe('left');
    expect(seatPositionFromViewer(0, 2)).toBe('right');
  });

  it('rotates the table with viewer seat 1 instead of sorting by seat id', () => {
    expect(opponentSeatsFromViewer(1)).toEqual([2, 0]);
    expect(seatPositionFromViewer(1, 1)).toBe('self');
    expect(seatPositionFromViewer(1, 2)).toBe('left');
    expect(seatPositionFromViewer(1, 0)).toBe('right');
  });

  it('rotates the table with viewer seat 2', () => {
    expect(opponentSeatsFromViewer(2)).toEqual([0, 1]);
    expect(seatPositionFromViewer(2, 2)).toBe('self');
    expect(seatPositionFromViewer(2, 0)).toBe('left');
    expect(seatPositionFromViewer(2, 1)).toBe('right');
  });
});
