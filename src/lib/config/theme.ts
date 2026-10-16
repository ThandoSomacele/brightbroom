// src/lib/config/theme.ts
//
// BrightBroom's palette, the one place colour values live. Tailwind reads it at
// build time (tailwind.config.ts) and server code reads it for emails. No $env
// here, so a relative import from the Tailwind config works.
//
// A deployment for another cleaning company can set BRAND_PRIMARY and
// BRAND_SECONDARY (hex, e.g. "#1E6091") when it builds; a full 50-950 scale is
// derived from each. Set them at runtime too so emails match the site. Unset,
// the scales are exactly the teal and orange below.

/**
 * Brand teal. Bright teal is a fill colour: text on it is dark (primary-950,
 * 8.3:1), never white (2.2:1). Teal as text uses primary-700 (5.4:1 on white).
 */
export const teal = {
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
} as const;

/** Brand orange. White on orange and orange on white both pass (4.7:1). */
export const orange = {
  DEFAULT: "#C2511F",
  50: "#FCE9DF",
  100: "#F9D3BF",
  200: "#F2A77F",
  300: "#EB7B40",
  400: "#D45F24",
  500: "#C2511F",
  600: "#9D4319",
  700: "#783413",
  800: "#52240D",
  900: "#2C1306",
  950: "#190B04",
} as const;

/** A Tailwind colour: DEFAULT plus the 50-950 shades */
export type ColorScale = {
  DEFAULT: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

type Rgb = [number, number, number];
type Lab = [number, number, number];

/** "#1e6091" or "#16a" → "#1E6091"; null when it is not a hex colour */
export function normaliseHex(input: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const digits = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${digits.toUpperCase()}`;
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as Rgb;
}

function rgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

// sRGB <-> OKLab (Björn Ottosson's matrices). Mixing in OKLab keeps the hue
// steady and spaces the steps evenly to the eye, unlike mixing raw RGB.
function rgbToOklab([r, g, b]: Rgb): Lab {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const WHITE = rgbToOklab([1, 1, 1]);

/**
 * How far each shade moves from the base colour: towards white (+) or towards
 * a deep shade of the same hue (-). Tuned so the derived scales for #20C3AF and
 * #C2511F land within a few lightness points of the hand-made ones above.
 */
const SHADE_MIX: Record<Exclude<keyof ColorScale, "DEFAULT">, number> = {
  50: 0.87,
  100: 0.74,
  200: 0.5,
  300: 0.27,
  400: 0.1,
  500: 0,
  600: -0.2,
  700: -0.4,
  800: -0.6,
  900: -0.8,
  950: -0.9,
};

/**
 * Derive a full Tailwind scale from one brand colour. DEFAULT and 500 are the
 * colour itself; lighter shades mix it with white, darker ones with a
 * near-black of the same hue (pure black would flatten 900/950 to black).
 */
export function generateScale(hex: string): ColorScale {
  const base = normaliseHex(hex);
  if (!base) throw new Error(`Not a hex colour: "${hex}"`);
  const lab = rgbToOklab(hexToRgb(base));
  const deep: Lab = [0.14, lab[1] * 0.35, lab[2] * 0.35];

  const scale = { DEFAULT: base } as ColorScale;
  for (const [shade, amount] of Object.entries(SHADE_MIX)) {
    const target = amount >= 0 ? WHITE : deep;
    const t = Math.abs(amount);
    const mixed = lab.map((v, i) => v + (target[i] - v) * t) as Lab;
    scale[Number(shade) as keyof typeof SHADE_MIX] = t === 0 ? base : rgbToHex(oklabToRgb(mixed));
  }
  return scale;
}

/**
 * The scale to use: the default one when no override is set, otherwise one
 * generated from the override. A malformed override fails loudly, so a typo
 * breaks the build rather than quietly shipping the wrong colours.
 */
export function resolveScale(override: string | undefined, fallback: ColorScale): ColorScale {
  if (!override || !override.trim()) return fallback;
  if (!normaliseHex(override)) {
    throw new Error(`Brand colour override "${override}" is not a hex colour like #1E6091`);
  }
  return generateScale(override);
}

// process is absent in the browser; there the defaults apply.
const buildEnv: Record<string, string | undefined> =
  typeof process !== "undefined" && process.env ? process.env : {};

/** Primary (teal by default) and secondary (orange by default) scales */
export const primary = resolveScale(buildEnv.BRAND_PRIMARY, teal);
export const secondary = resolveScale(buildEnv.BRAND_SECONDARY, orange);

/**
 * Colours for emails and other non-Tailwind surfaces. Emails use the deep
 * shade of the primary so the white button text stays readable.
 */
export const brandColors = {
  primary: primary[700],
  secondary: secondary.DEFAULT,
  brightTeal: primary.DEFAULT,
} as const;
