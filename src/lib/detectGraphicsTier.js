/**
 * Detect the device's graphics capability tier.
 * Used throughout the game to gate postprocessing, particle counts,
 * DPR caps, and whether to use r3f vs CSS-only reveals.
 *
 * Tier meanings:
 *   low    -> no postprocessing, capped particles, DPR=1,
 *             CrateReveal CSS-only (skip CrystalShatter)
 *   medium -> postprocessing on 3D set-pieces only,
 *             DPR capped at 1.5, full particle counts
 *   high   -> everything on, DPR capped at 2
 */
export function detectGraphicsTier() {
  if (typeof window === "undefined") return "medium";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";

  const mem = navigator.deviceMemory || 4;        // GB, Chrome-only; 4 = safe default
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

  if (mem <= 2 || cores <= 4) return "low";
  if (isMobile || mem <= 4) return "medium";
  return "high";
}
