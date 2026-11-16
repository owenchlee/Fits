import type { Metadata } from "next";
import { LegalLink, LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, PUBLISHER_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Fits",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={LEGAL_EFFECTIVE_DATE}
      intro={
        <p>
          {APP_NAME} is a strength-training log published by {PUBLISHER_NAME} (&quot;we&quot;, &quot;us&quot;). This
          policy explains what information {APP_NAME} collects, why, where it&apos;s stored, who can access it, and the
          choices you have. The short version: we collect only what&apos;s needed to run the app, we never sell your
          data, we don&apos;t use advertising or analytics trackers, and you can export or delete everything at any
          time from inside the app.
        </p>
      }
    >
      <LegalSection title="1. Information we collect">
        <p>
          <strong>If you use {APP_NAME} without an account</strong>, everything you enter stays in your device&apos;s
          storage. It is never sent to us.
        </p>
        <p>
          <strong>If you create an account</strong>, we collect:
        </p>
        <LegalList>
          <li>
            <strong>Account information:</strong> your email address, your password (stored only as a salted hash by our
            authentication provider — we can&apos;t see it), an account ID, and a record of which version of our Terms
            and this policy you agreed to and when.
          </li>
          <li>
            <strong>Training data you enter:</strong> exercises, custom programs and schedules, workouts (titles, start
            and finish times, notes), sets (weight, reps, RPE, warm-up/failure/drop-set flags), and strength percentile
            snapshots that {APP_NAME} calculates from your lifts.
          </li>
          <li>
            <strong>Body and profile data you enter:</strong> bodyweight, body-fat percentage, body measurements, the sex
            you select for strength-standard comparisons, and app preferences (units, rest timer, plates, active
            program, streak).
          </li>
        </LegalList>
        <p>
          Some of this — workouts, bodyweight, body measurements, and anything derived from them — may count as
          &quot;health data&quot; or &quot;consumer health data&quot; under some laws. Our{" "}
          <LegalLink href="/health-data">Consumer Health Data Policy</LegalLink> covers it in more detail.
        </p>
        <p>
          <strong>Technical information:</strong> like any online service, the servers that deliver {APP_NAME} and our
          authentication provider automatically record basic request information — IP address, device and browser type,
          and timestamps — in short-lived logs used for security, abuse prevention, and keeping the service running.
        </p>
        <p>
          <strong>What we don&apos;t collect:</strong> your name, location, contacts, photos, advertising identifiers,
          or anything from Apple Health. {APP_NAME} contains no analytics, advertising, crash-reporting, or tracking
          SDKs, and we don&apos;t track you across other apps or websites.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use it">
        <LegalList>
          <li>To provide the app: storing your training log, calculating statistics and estimates, and syncing your data between your devices.</li>
          <li>To run your account: signing you in, password resets, and account deletion.</li>
          <li>To keep the service secure and working, and to respond to you when you contact us.</li>
          <li>To comply with the law.</li>
        </LegalList>
        <p>
          We do not sell or rent your personal information, share it for cross-context behavioral advertising, use it to
          build advertising profiles, or use your health and fitness data for marketing or data mining.
        </p>
      </LegalSection>

      <LegalSection title="3. Where your data is stored and who can access it">
        <p>
          {APP_NAME} is local-first: your data is stored on your device and the app works from that copy. With an
          account, it is also stored with these service providers, who process it only on our instructions and only to
          run {APP_NAME}:
        </p>
        <LegalList>
          <li>
            <strong>Supabase</strong> — our database and authentication provider (account and synced training data,
            sign-in emails).
          </li>
          <li>
            <strong>Vercel</strong> — hosts the {APP_NAME} app and its server code (request logs only; your training
            data isn&apos;t stored there).
          </li>
        </LegalList>
        <p>
          We require these providers to protect your data at least as well as this policy does. Beyond them, we only
          disclose information if required by law (for example, a valid court order), to protect someone&apos;s safety,
          or as part of a transfer of the app to a new owner — in which case this policy would continue to apply to
          your data, and we&apos;d tell you first. If you download {APP_NAME} from the App Store, Apple handles that
          transaction under its own privacy policy.
        </p>
        <p>
          {APP_NAME} is published from Canada, but these providers may store and process data in the United States or
          other countries, where it may be accessible to courts, law enforcement, and national security authorities
          under those countries&apos; laws. Where the law requires it (for example, for users in the EEA, UK, or
          Switzerland), transfers rely on safeguards such as the European Commission&apos;s Standard Contractual
          Clauses.
        </p>
      </LegalSection>

      <LegalSection title="4. How long we keep it">
        <LegalList>
          <li>Your account and synced data are kept for as long as you have an account.</li>
          <li>
            When you delete an item (a workout, a set, a measurement), it&apos;s removed from your devices immediately and
            permanently purged from our servers within 30 days.
          </li>
          <li>
            When you delete your account, your account and all synced data are deleted from our live database
            immediately. Copies may remain in our provider&apos;s encrypted backups for a limited time (generally no more
            than 30 days) until they are overwritten.
          </li>
          <li>Server request logs are kept only briefly, generally no more than 30 days.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Your choices and rights">
        <p>Everything below is available to everyone, wherever you live:</p>
        <LegalList>
          <li>
            <strong>Access and portability:</strong> Profile &gt; Your data &gt; Export as JSON downloads a full copy of
            your data.
          </li>
          <li>
            <strong>Correction:</strong> edit any workout, set, program, or setting directly in the app.
          </li>
          <li>
            <strong>Deletion:</strong> delete individual items in the app; Profile &gt; Reset all data erases all of your
            training data; Profile &gt; Delete account permanently deletes your account and all associated data.
          </li>
          <li>
            <strong>Withdrawing consent:</strong> you can withdraw your consent to us processing your health and fitness
            data at any time by deleting that data or your account. Withdrawing consent doesn&apos;t affect processing
            that happened before.
          </li>
          <li>
            <strong>Anything else</strong> — including a list of the service providers that received your data, or help
            with any request above — email us at <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>.
            We&apos;ll respond within 30 days (or sooner if your local law requires), and won&apos;t treat you
            differently for exercising your rights. We may need to verify that a request comes from the account owner.
          </li>
        </LegalList>
        <p>
          <strong>Canada:</strong> we handle personal information in line with the Personal Information Protection and
          Electronic Documents Act (PIPEDA) and, for Quebec residents, Quebec&apos;s private-sector privacy law. You can
          access, correct, and delete your information as described above, and withdraw consent at any time. If
          you&apos;re not satisfied with how we handle a request, you can complain to the{" "}
          <LegalLink href="https://www.priv.gc.ca/">Office of the Privacy Commissioner of Canada</LegalLink> (or, in
          Quebec, the Commission d&apos;accès à l&apos;information).
        </p>
        <p>
          <strong>EEA, UK, and Switzerland:</strong> we process account and training data to perform our contract with
          you (providing the app), health data on the basis of your explicit consent, and technical logs on the basis of
          our legitimate interest in keeping the service secure. You also have the right to object to or restrict
          processing, and to complain to your local data protection authority.
        </p>
        <p>
          <strong>U.S. state privacy laws</strong> (such as California&apos;s CCPA/CPRA): we don&apos;t sell or
          &quot;share&quot; personal information as those laws define it, and we use sensitive personal information only
          to provide the service you asked for. You have the right to know, access, correct, and delete your
          information, which you can exercise as described above. Washington and Nevada residents: see our{" "}
          <LegalLink href="/health-data">Consumer Health Data Policy</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection title="6. Security">
        <p>
          Data is encrypted in transit (HTTPS) and at rest by our database provider, passwords are hashed, and
          database access rules ensure each account can only read and write its own rows. No system is perfectly
          secure, though, so please use a strong, unique password. If a breach affecting your data ever occurs,
          we&apos;ll notify you as required by law.
        </p>
      </LegalSection>

      <LegalSection title="7. Children">
        <p>
          {APP_NAME} isn&apos;t directed at children and you must be at least 13 (or the minimum age required in your
          country) to use it. We don&apos;t knowingly collect personal information from children under 13. If you believe
          a child has given us personal information, contact us and we&apos;ll delete it.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to this policy">
        <p>
          If we make a material change, we&apos;ll update the effective date above and ask you to review and agree to
          the new version in the app before you continue using it.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          Questions or requests: <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink> ({PUBLISHER_NAME},
          publisher of {APP_NAME}).
        </p>
      </LegalSection>
    </LegalPage>
  );
}
