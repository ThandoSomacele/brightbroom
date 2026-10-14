// src/lib/config/theme.ts
//
// BrightBroom's palette, the one place colour values live. Tailwind reads it at
// build time (tailwind.config.ts) and server code reads it for emails. No $env
// here, so a relative import from the Tailwind config works.

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

/**
 * Colours for emails and other non-Tailwind surfaces. Emails use the deep
 * teal so the white button text stays readable.
 */
export const brandColors = {
  primary: teal[700],
  secondary: orange.DEFAULT,
  brightTeal: teal.DEFAULT,
} as const;
