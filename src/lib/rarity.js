/**
 * Auto-derive rarity from a content entry's badge text.
 * No need to hand-tag 60+ entries — compute at render time.
 *
 * Rarity drives:
 *   - Reveal intensity (crystal shatter for legendary, crate for common)
 *   - Card border treatment (glow intensity, holo sheen opacity)
 */
export function deriveRarity(content) {
  const badge = (content.badge || "").toLowerCase();
  if (badge.includes("🥇") || badge.includes("capstone") || badge.includes("1st")) return "legendary";
  if (badge.includes("🥈") || badge.includes("2nd")) return "epic";
  if (badge.includes("🥉") || badge.includes("3rd") || badge.includes("top 5")) return "rare";
  return "common";
}
