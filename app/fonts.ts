import localFont from "next/font/local";

// Self-hosted Outfit variable font (already vendored at ./Outfit) instead of
// the design system's Google Fonts @import -- same typeface, no external
// network dependency at build/runtime.
export const outfit = localFont({
  src: "../Outfit/Outfit-VariableFont_wght.ttf",
  variable: "--font-outfit",
  weight: "300 800",
  display: "swap",
});
