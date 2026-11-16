"use client";

import Link from "next/link";

export interface ConsentState {
  terms: boolean;
  healthData: boolean;
}

export const NO_CONSENT: ConsentState = { terms: false, healthData: false };

export const hasFullConsent = (c: ConsentState) => c.terms && c.healthData;

function ConsentCheckbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-primary"
      />
      <label htmlFor={id} className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
        {children}
      </label>
    </div>
  );
}

const linkClass = "font-medium text-foreground underline underline-offset-2";

/**
 * The two affirmative agreements Fits needs before it stores anything: the Terms/Privacy Policy
 * (plus the minimum-age confirmation) and a separate, specific consent to processing health and
 * fitness data — kept separate because consumer-health-data laws (e.g. Washington's My Health My
 * Data Act) don't accept that consent bundled into a general terms acceptance.
 */
export function ConsentFields({
  value,
  onChange,
  idPrefix = "consent",
}: {
  value: ConsentState;
  onChange: (next: ConsentState) => void;
  idPrefix?: string;
}) {
  return (
    <div className="space-y-3">
      <ConsentCheckbox id={`${idPrefix}-terms`} checked={value.terms} onChange={(terms) => onChange({ ...value, terms })}>
        I&apos;m at least 13 years old and I agree to the{" "}
        <Link href="/terms" className={linkClass}>
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
        .
      </ConsentCheckbox>
      <ConsentCheckbox
        id={`${idPrefix}-health`}
        checked={value.healthData}
        onChange={(healthData) => onChange({ ...value, healthData })}
      >
        I consent to Fits storing and processing the workout and body data I enter (such as lifts, bodyweight,
        and measurements) to provide the app, as described in the{" "}
        <Link href="/health-data" className={linkClass}>
          Consumer Health Data Policy
        </Link>
        . I can withdraw this at any time by deleting my data.
      </ConsentCheckbox>
    </div>
  );
}
