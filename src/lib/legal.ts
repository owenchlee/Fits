/**
 * Single source of truth for the facts every legal page (privacy, terms, consumer health data,
 * support) quotes. Change them here, never inline in a page.
 *
 * Bump LEGAL_VERSION whenever the Terms or Privacy Policy change materially: everyone who accepted
 * an older version is asked to accept again on their next launch (see ConsentGate).
 */
export const LEGAL_VERSION = "2026-10-05";
export const LEGAL_EFFECTIVE_DATE = "October 5, 2026";

/** Who publishes Fits — must match the seller name shown on the App Store listing. */
export const PUBLISHER_NAME = "Owen Lee";

/** Where users send privacy requests and support questions. TODO before launch: replace with a real, monitored inbox. */
export const CONTACT_EMAIL = "support@fits-app.example";

/** Law that governs the Terms of Use: where the publisher lives (an individual developer in Ontario). */
export const GOVERNING_LAW = "the Province of Ontario and the federal laws of Canada applicable there";

export const APP_NAME = "Fits";

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/health-data", label: "Consumer Health Data Policy" },
  { href: "/support", label: "Support" },
  { href: "/licenses", label: "Open-source licenses" },
] as const;

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
