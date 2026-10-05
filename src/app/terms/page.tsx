import type { Metadata } from "next";
import { LegalLink, LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, CONTACT_EMAIL, GOVERNING_LAW, LEGAL_EFFECTIVE_DATE, PUBLISHER_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use — Fits",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated={LEGAL_EFFECTIVE_DATE}
      intro={
        <p>
          These Terms of Use (&quot;Terms&quot;) are an agreement between you and {PUBLISHER_NAME} (&quot;we&quot;,
          &quot;us&quot;), the publisher of {APP_NAME}. By using {APP_NAME} you agree to these Terms and to our{" "}
          <LegalLink href="/privacy">Privacy Policy</LegalLink>. If you don&apos;t agree, please don&apos;t use the app.
          Section 2 contains important health and safety information — please read it.
        </p>
      }
    >
      <LegalSection title="1. Who can use Fits">
        <p>
          You must be at least 13 years old (or the minimum age required in your country) to use {APP_NAME}. If
          you&apos;re under 18, or under the age of majority where you live, you may use {APP_NAME} only with the
          involvement and permission of a parent or legal guardian, who agrees to these Terms on your behalf.
        </p>
      </LegalSection>

      <LegalSection title="2. Health and safety — not medical advice" id="health">
        <p>
          <strong>
            {APP_NAME} is a tool for logging and reviewing your own training. It does not provide medical advice,
            diagnosis, or treatment, and it is not a substitute for a doctor, physical therapist, or qualified coach.
          </strong>
        </p>
        <LegalList>
          <li>
            Consult a physician before starting any exercise program or changing your training, especially if you are
            pregnant, have or suspect a medical condition (including heart, blood-pressure, or joint problems), are
            recovering from an injury, take medication, or have been inactive.
          </li>
          <li>
            Stop exercising immediately and seek medical help if you feel pain, dizziness, faintness, shortness of
            breath, or chest discomfort.
          </li>
          <li>
            Resistance training carries inherent risks, including muscle strains, joint and back injuries, injuries
            from dropped weights or equipment, and, rarely, serious injury or death. Use proper technique, appropriate
            loads, safety equipment such as collars and safety bars, and a spotter where appropriate.
          </li>
          <li>
            Built-in programs, suggested sets, reps, rest times, warm-up weights, plate breakdowns, estimated one-rep
            maxes, and strength percentiles are general information and mathematical estimates. They aren&apos;t
            tailored to you, may be inaccurate, and aren&apos;t a recommendation that you lift any particular weight.
            Use your own judgment and never attempt a load because the app suggests or estimates it.
          </li>
        </LegalList>
        <p>
          <strong>
            You choose how you train and you do so voluntarily and at your own risk. To the fullest extent permitted by
            law, you assume all risks of injury, illness, or loss arising from your exercise and training, whether or
            not you use {APP_NAME} while doing it.
          </strong>
        </p>
      </LegalSection>

      <LegalSection title="3. Built-in programs and strength data">
        <p>
          Built-in programs are generic templates based on widely used, publicly known training structures (such as
          linear progression and push/pull/legs splits). They are not endorsed by, affiliated with, or official
          versions of any program created or sold by a third party.
        </p>
        <p>
          Strength percentiles compare your estimated lifts against approximations of publicly available, community
          sourced strength standards (including data published by strengthlevel.com). {APP_NAME} is not affiliated
          with or endorsed by those sources, and the comparisons are rough estimates, not a scientific or medical
          assessment.
        </p>
      </LegalSection>

      <LegalSection title="4. Your account">
        <p>
          You can use {APP_NAME} without an account; your data then stays on your device only. If you create an
          account, give us an accurate email address, keep your password confidential, and let us know if you suspect
          someone else has accessed your account. You&apos;re responsible for activity under your account. You can
          delete your account at any time from Profile.
        </p>
      </LegalSection>

      <LegalSection title="5. Your data">
        <p>
          You own the training and body data you enter. You give us a limited permission to store, copy, process, and
          display it solely to provide {APP_NAME} to you (for example, to sync it between your devices), as described
          in our <LegalLink href="/privacy">Privacy Policy</LegalLink>. That permission ends when you delete the data or
          your account, subject to the short backup retention period described there.
        </p>
        <p>
          We work hard to keep your data safe, but no software is perfect. Data stored only on your device (including
          all data used without an account) can be lost if you delete the app, clear its storage, or lose your device.
          Please use Profile &gt; Export to keep your own backups.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable use">
        <p>You agree not to:</p>
        <LegalList>
          <li>break the law or infringe anyone&apos;s rights while using {APP_NAME};</li>
          <li>access or try to access another person&apos;s account or data;</li>
          <li>interfere with, overload, probe, or attempt to bypass the security of {APP_NAME} or its servers;</li>
          <li>reverse engineer the service except where the law allows it despite this restriction; or</li>
          <li>use automated means to create accounts or access the service.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Our app and your license">
        <p>
          {APP_NAME}, including its software, design, and content (other than your data and open-source components
          licensed under their own terms — see <LegalLink href="/licenses">Open-source licenses</LegalLink>), belongs to
          us. We grant you a personal, non-exclusive, non-transferable, revocable license to use {APP_NAME} for your own
          non-commercial use in line with these Terms. If you send us feedback, we may use it without obligation to you.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes, availability, and termination">
        <p>
          We may change, add, or remove features, and may suspend or discontinue {APP_NAME}. If we discontinue a service
          that stores your data, we&apos;ll give reasonable advance notice where possible so you can export it. We may
          suspend or close an account that violates these Terms. You can stop using {APP_NAME} and delete your account
          at any time. Sections 2, 5, and 9 through 13 survive termination.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimer of warranties">
        <p>
          {APP_NAME} IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;. TO THE FULLEST EXTENT PERMITTED BY LAW,
          WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. WE DON&apos;T WARRANT THAT {APP_NAME.toUpperCase()} WILL BE
          UNINTERRUPTED, ERROR-FREE, OR SECURE, THAT CALCULATIONS OR ESTIMATES WILL BE ACCURATE, OR THAT DATA WILL NEVER
          BE LOST.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY PERSONAL INJURY, LOSS OF DATA, PROFITS, OR GOODWILL,
          ARISING OUT OF OR RELATING TO YOUR USE OF (OR INABILITY TO USE) {APP_NAME.toUpperCase()} OR ANY EXERCISE YOU
          PERFORM, EVEN IF WE&apos;VE BEEN ADVISED OF THE POSSIBILITY. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO{" "}
          {APP_NAME.toUpperCase()} IS LIMITED TO THE GREATER OF THE AMOUNT YOU PAID US FOR IT IN THE 12 MONTHS BEFORE THE
          CLAIM OR US$50.
        </p>
        <p>
          Some jurisdictions don&apos;t allow these exclusions or limits, so they may not fully apply to you. Nothing in
          these Terms limits liability that can&apos;t be limited by law — for example, for fraud, gross negligence, or
          death or personal injury caused by negligence where such limits are prohibited — or takes away rights you
          have as a consumer under mandatory law.
        </p>
      </LegalSection>

      <LegalSection title="11. Indemnity">
        <p>
          To the extent permitted by law, you agree to indemnify us against third-party claims arising from your breach
          of these Terms or your misuse of {APP_NAME}.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law and disputes">
        <p>
          These Terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict-of-laws rules, and any
          dispute will be resolved in the state or federal courts located there, except that if you&apos;re a consumer
          living in another country, you also keep the protection of your local mandatory laws and may bring claims in
          your local courts. Before filing a claim, please contact us so we can try to resolve it informally.
        </p>
      </LegalSection>

      <LegalSection title="13. Apple App Store terms">
        <p>If you downloaded {APP_NAME} from Apple&apos;s App Store, you and we also agree that:</p>
        <LegalList>
          <li>
            These Terms are between you and us, not Apple. We, not Apple, are solely responsible for {APP_NAME} and its
            content, and for providing any maintenance and support.
          </li>
          <li>
            Your license to use {APP_NAME} is limited to Apple-branded devices you own or control, as permitted by the
            Usage Rules in Apple&apos;s Media Services Terms and Conditions.
          </li>
          <li>
            If {APP_NAME} fails to conform to an applicable warranty, you may notify Apple, and Apple will refund the
            purchase price (if any); to the maximum extent permitted by law, Apple has no other warranty obligation
            with respect to {APP_NAME}.
          </li>
          <li>
            We, not Apple, are responsible for addressing any claims relating to {APP_NAME} or your possession and use of
            it, including product liability claims, claims that it fails to meet legal or regulatory requirements, and
            consumer protection, privacy, or similar claims.
          </li>
          <li>
            We, not Apple, are responsible for investigating, defending, settling, and discharging any third-party claim
            that {APP_NAME} or your use of it infringes that third party&apos;s intellectual property rights.
          </li>
          <li>
            You represent that you are not located in a country subject to a U.S. Government embargo or designated as a
            &quot;terrorist supporting&quot; country, and are not on any U.S. Government list of prohibited or
            restricted parties.
          </li>
          <li>You must comply with any applicable third-party terms (such as your wireless data agreement) when using {APP_NAME}.</li>
          <li>
            Apple and its subsidiaries are third-party beneficiaries of these Terms and, once you accept them, Apple may
            enforce them against you.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="14. Changes to these Terms">
        <p>
          We may update these Terms. If a change is material, we&apos;ll update the effective date and ask you to agree
          to the new version in the app before you continue using it.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>
          {PUBLISHER_NAME} — <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>
        </p>
        <p>
          If any part of these Terms is found unenforceable, the rest stays in effect. These Terms, together with the
          Privacy Policy and Consumer Health Data Policy, are our entire agreement about {APP_NAME}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
