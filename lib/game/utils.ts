import type { Position } from "./types";

/**
 * Convert position to array index
 * north=0, east=1, south=2, west=3
 */
export function positionToIndex(position: Position): number {
  const map: Record<Position, number> = {
    north: 0,
    east: 1,
    south: 2,
    west: 3,
  };
  return map[position];
}

/**
 * Convert array index to position
 * Handles negative indices correctly
 */
export function indexToPosition(index: number): Position {
  const positions: Position[] = ["north", "east", "south", "west"];
  return positions[((index % 4) + 4) % 4]!;
}

/**
 * Get the next position clockwise
 */
export function nextPosition(position: Position): Position {
  const index = positionToIndex(position);
  return indexToPosition(index + 1);
}

/**
 * Get the partner position (across the table)
 */
export function partnerPosition(position: Position): Position {
  const index = positionToIndex(position);
  return indexToPosition(index + 2);
}

/**
 * Get all positions in clockwise order starting from a given position
 */
export function getPositionsFrom(
  start: Position,
): [Position, Position, Position, Position] {
  let current = start;
  const positions: Position[] = [];
  for (let i = 0; i < 4; i++) {
    positions.push(current);
    current = nextPosition(current);
  }
  return positions as [Position, Position, Position, Position];
}
