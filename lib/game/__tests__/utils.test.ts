import { describe, it, expect } from "vitest";
import type { Position } from "../types";
import {
  positionToIndex,
  indexToPosition,
  nextPosition,
  partnerPosition,
  getPositionsFrom,
} from "../utils";

describe("Position to Index", () => {
  it("should convert north to 0", () => {
    expect(positionToIndex("north")).toBe(0);
  });

  it("should convert east to 1", () => {
    expect(positionToIndex("east")).toBe(1);
  });

  it("should convert south to 2", () => {
    expect(positionToIndex("south")).toBe(2);
  });

  it("should convert west to 3", () => {
    expect(positionToIndex("west")).toBe(3);
  });
});

describe("Index to Position", () => {
  it("should convert 0 to north", () => {
    expect(indexToPosition(0)).toBe("north");
  });

  it("should convert 1 to east", () => {
    expect(indexToPosition(1)).toBe("east");
  });

  it("should convert 2 to south", () => {
    expect(indexToPosition(2)).toBe("south");
  });

  it("should convert 3 to west", () => {
    expect(indexToPosition(3)).toBe("west");
  });

  it("should wrap around with modulo", () => {
    expect(indexToPosition(4)).toBe("north");
    expect(indexToPosition(5)).toBe("east");
    expect(indexToPosition(7)).toBe("west");
  });

  it("should handle large numbers with modulo", () => {
    expect(indexToPosition(8)).toBe("north"); // 8 % 4 = 0
    expect(indexToPosition(9)).toBe("east"); // 9 % 4 = 1
    expect(indexToPosition(11)).toBe("west"); // 11 % 4 = 3
  });

  it("should handle negative numbers with modulo", () => {
    expect(indexToPosition(-1)).toBe("west"); // -1 should wrap to 3
    expect(indexToPosition(-2)).toBe("south"); // -2 should wrap to 2
    expect(indexToPosition(-4)).toBe("north"); // -4 should wrap to 0
  });
});

describe("Next Position", () => {
  it("should go from north to east", () => {
    expect(nextPosition("north")).toBe("east");
  });

  it("should go from east to south", () => {
    expect(nextPosition("east")).toBe("south");
  });

  it("should go from south to west", () => {
    expect(nextPosition("south")).toBe("west");
  });

  it("should wrap from west to north", () => {
    expect(nextPosition("west")).toBe("north");
  });

  it("should maintain clockwise order through multiple calls", () => {
    let pos: Position = "north";
    pos = nextPosition(pos); // east
    pos = nextPosition(pos); // south
    pos = nextPosition(pos); // west
    pos = nextPosition(pos); // north again

    expect(pos).toBe("north");
  });
});

describe("Partner Position", () => {
  it("should return south for north", () => {
    expect(partnerPosition("north")).toBe("south");
  });

  it("should return west for east", () => {
    expect(partnerPosition("east")).toBe("west");
  });

  it("should return north for south", () => {
    expect(partnerPosition("south")).toBe("north");
  });

  it("should return east for west", () => {
    expect(partnerPosition("west")).toBe("east");
  });

  it("should be symmetric", () => {
    const positions: Position[] = ["north", "east", "south", "west"];

    positions.forEach((pos) => {
      const partner = partnerPosition(pos);
      expect(partnerPosition(partner)).toBe(pos);
    });
  });
});

describe("Get Positions From", () => {
  it("should return all positions starting from north", () => {
    const positions = getPositionsFrom("north");

    expect(positions).toEqual(["north", "east", "south", "west"]);
  });

  it("should return all positions starting from east", () => {
    const positions = getPositionsFrom("east");

    expect(positions).toEqual(["east", "south", "west", "north"]);
  });

  it("should return all positions starting from south", () => {
    const positions = getPositionsFrom("south");

    expect(positions).toEqual(["south", "west", "north", "east"]);
  });

  it("should return all positions starting from west", () => {
    const positions = getPositionsFrom("west");

    expect(positions).toEqual(["west", "north", "east", "south"]);
  });

  it("should always return exactly 4 positions", () => {
    const positions: Position[] = ["north", "east", "south", "west"];

    positions.forEach((startPos) => {
      const result = getPositionsFrom(startPos);
      expect(result).toHaveLength(4);
    });
  });

  it("should maintain clockwise order", () => {
    const positions = getPositionsFrom("east");

    expect(positions[0]).toBe("east");
    expect(positions[1]).toBe(nextPosition("east"));
    expect(positions[2]).toBe(nextPosition(nextPosition("east")));
    expect(positions[3]).toBe(nextPosition(nextPosition(nextPosition("east"))));
  });

  it("should include all unique positions", () => {
    const positions = getPositionsFrom("north");
    const uniquePositions = new Set(positions);

    expect(uniquePositions.size).toBe(4);
  });
});

describe("Position Utils Integration", () => {
  it("should round-trip position through index", () => {
    const positions: Position[] = ["north", "east", "south", "west"];

    positions.forEach((pos) => {
      const index = positionToIndex(pos);
      const backToPos = indexToPosition(index);
      expect(backToPos).toBe(pos);
    });
  });

  it("should correctly navigate full table rotation", () => {
    let current: Position = "north";
    const visited: Position[] = [];

    for (let i = 0; i < 4; i++) {
      visited.push(current);
      current = nextPosition(current);
    }

    expect(visited).toEqual(["north", "east", "south", "west"]);
    expect(current).toBe("north"); // Back to start
  });

  it("should correctly identify teams by position", () => {
    // Team 0: north & south (indices 0 & 2)
    expect(positionToIndex("north") % 2).toBe(0);
    expect(positionToIndex("south") % 2).toBe(0);

    // Team 1: east & west (indices 1 & 3)
    expect(positionToIndex("east") % 2).toBe(1);
    expect(positionToIndex("west") % 2).toBe(1);
  });
});
