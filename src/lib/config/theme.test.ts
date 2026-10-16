// src/lib/config/theme.test.ts
import { describe, expect, it } from "vitest";
import { generateScale, orange, resolveScale, teal } from "./theme";

const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const HEX = /^#[0-9A-F]{6}$/;

/** WCAG relative luminance, to check the shades really run light → dark */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("brand colour scales", () => {
  it("uses today's teal and orange unchanged when no override is set", () => {
    expect(resolveScale(undefined, teal)).toBe(teal);
    expect(resolveScale("", orange)).toBe(orange);
    expect(resolveScale("   ", teal)).toEqual({
      DEFAULT: "#20C3AF",
      50: "#E4F8F5",
      100: "#C9F1EB",
      200: "#94E3D7",
      300: "#5FD4C3",
      400: "#2AC5B0",
      500: "#20C3AF",
      600: "#1B9E8E",
      700: "#15776D",
      800: "#10514B",
      900: "#0A2A28",
      950: "#051716",
    });
  });

  it("derives eleven valid shades from one hex, keeping the hex as DEFAULT", () => {
    const scale = resolveScale("#1E6091", teal);

    expect(scale.DEFAULT).toBe("#1E6091");
    expect(scale[500]).toBe("#1E6091");
    expect(Object.keys(scale).filter((k) => k !== "DEFAULT").sort((a, b) => +a - +b)).toEqual(SHADES);
    for (const shade of SHADES) {
      expect(scale[Number(shade) as keyof typeof scale]).toMatch(HEX);
    }

    // Each step is darker than the one before it
    const lum = SHADES.map((s) => luminance(scale[Number(s) as keyof typeof scale]));
    for (let i = 1; i < lum.length; i++) expect(lum[i]).toBeLessThan(lum[i - 1]);
  });

  it("accepts short and lower-case hex", () => {
    expect(generateScale("#16a").DEFAULT).toBe("#1166AA");
    expect(generateScale("1e6091").DEFAULT).toBe("#1E6091");
  });

  it("refuses an override that is not a colour", () => {
    expect(() => resolveScale("teal", teal)).toThrow(/not a hex colour/);
  });
});
