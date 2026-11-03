import { describe, it, expect } from "vitest";

// Minimal getComputedStyle stand-in: the helper only reads custom properties.
function withVar(value: string) {
  const el = {} as Element;
  (globalThis as unknown as { getComputedStyle: unknown }).getComputedStyle = () => ({
    getPropertyValue: () => value,
  });
  return el;
}

const { cssTimeMs, cssNumber } = await import("../../src/lib/motion");

describe("cssTimeMs", () => {
  it("reads milliseconds and the minifier's seconds form alike", () => {
    expect(cssTimeMs(withVar("150ms"), "--x", 0)).toBe(150);
    expect(cssTimeMs(withVar(".15s"), "--x", 0)).toBe(150);
    expect(cssTimeMs(withVar(" 1.4s"), "--x", 0)).toBe(1400);
  });
  it("falls back when the property is missing", () => {
    expect(cssTimeMs(withVar(""), "--x", 250)).toBe(250);
  });
});

describe("cssNumber", () => {
  it("reads px values as numbers", () => {
    expect(cssNumber(withVar("3px"), "--x", 0)).toBe(3);
    expect(cssNumber(withVar(""), "--x", 7)).toBe(7);
  });
});
