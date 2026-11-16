import type { Metadata } from "next";
import { LegalLink, LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, PUBLISHER_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Consumer Health Data Policy — Fits",
};

export default function HealthDataPolicyPage() {
  return (
    <LegalPage
      title="Consumer Health Data Policy"
      updated={LEGAL_EFFECTIVE_DATE}
      intro={
        <p>
          This policy supplements our <LegalLink href="/privacy">Privacy Policy</LegalLink> and describes how{" "}
          {PUBLISHER_NAME} handles &quot;consumer health data&quot; as defined by Washington&apos;s My Health My Data Act,
          Nevada&apos;s SB 370, and similar laws. We apply it to all {APP_NAME} users, wherever they live.
        </p>
      }
    >
      <LegalSection title="Consumer health data we collect">
        <p>Only what you choose to enter into {APP_NAME}:</p>
        <LegalList>
          <li>Exercise and training records: exercises, workouts, sets, weights, repetitions, effort ratings (RPE), and workout duration.</li>
          <li>Body data: bodyweight, body-fat percentage, and body measurements (such as waist or arm circumference).</li>
          <li>The sex you select, used only to choose which strength-standard table to compare against.</li>
          <li>
            Information {APP_NAME} derives from the above: estimated one-rep maxes, training volume, streaks, and
            strength percentiles and tiers.
          </li>
        </LegalList>
        <p>
          We don&apos;t collect diagnoses, medications, reproductive or sexual health information, biometric
          identifiers, genetic data, or location, and we don&apos;t read data from Apple Health or any device sensor.
        </p>
      </LegalSection>

      <LegalSection title="Why we collect it and where it comes from">
        <p>
          All of it comes directly from you. We collect and use it only to provide the features you ask for: keeping
          your training log, calculating your statistics and estimates, and — if you have an account — syncing it
          between your devices. We ask for your consent before collecting it, and we don&apos;t use it for any other
          purpose.
        </p>
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>
          <strong>We never sell consumer health data</strong>, and we don&apos;t share it with advertisers, data brokers,
          or anyone else for their own purposes. If you have an account, it&apos;s stored by these processors, which
          act only on our instructions:
        </p>
        <LegalList>
          <li>
            <strong>Supabase, Inc.</strong> — database and authentication hosting.
          </li>
          <li>
            <strong>Vercel, Inc.</strong> — app hosting (transmits data between your device and the database; does not
            store it).
          </li>
        </LegalList>
        <p>
          We have no affiliates that receive consumer health data. We would disclose it otherwise only if legally
          required, for example in response to a valid court order. Without an account, your data never leaves your
          device.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <LegalList>
          <li>
            <strong>Confirm and access</strong> whether we hold your consumer health data and get a copy of it (Profile
            &gt; Export as JSON gives you an immediate copy), along with a list of all third parties and affiliates with
            which we&apos;ve shared it.
          </li>
          <li>
            <strong>Withdraw consent</strong> to our collection and sharing of it — delete the data in the app or your
            account, or email us.
          </li>
          <li>
            <strong>Delete it</strong> — Profile &gt; Reset all data or Profile &gt; Delete account, or email us. Deletion
            also reaches our processors and backups as described in the Privacy Policy.
          </li>
        </LegalList>
        <p>
          To make a request we can&apos;t handle in the app, email{" "}
          <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink> from your account&apos;s email address.
          We&apos;ll respond within 45 days (we may extend that once by another 45 days if reasonably necessary, and
          will tell you why). These requests are free, and we won&apos;t treat you differently for making one.
        </p>
        <p>
          <strong>Appeals:</strong> if we decline your request, you can appeal by replying to our decision with
          &quot;Appeal&quot; in the subject line. We&apos;ll respond in writing within 45 days explaining what we did and
          why. If you&apos;re not satisfied, Washington residents can contact the Washington State Attorney General
          (atg.wa.gov), and Nevada residents the Nevada Attorney General (ag.nv.gov).
        </p>
      </LegalSection>
    </LegalPage>
  );
}
