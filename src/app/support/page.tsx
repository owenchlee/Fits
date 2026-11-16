import type { Metadata } from "next";
import { LegalLink, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Support — Fits",
};

const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "Do I need an account?",
    a: (
      <>
        No. Tap &quot;Continue without an account&quot; on the log-in screen and everything is stored on this device
        only. Create an account any time later from Profile to back up and sync — your existing workouts come with you.
      </>
    ),
  },
  {
    q: "How do I back up or export my data?",
    a: <>Profile &gt; Your data &gt; Export as JSON saves a complete copy of your workouts, programs, and measurements.</>,
  },
  {
    q: "How do I delete my account?",
    a: (
      <>
        Profile &gt; Account &gt; Delete account. This permanently deletes your account and all synced data. To erase
        just your training data but keep the account, use Profile &gt; Your data &gt; Reset all data.
      </>
    ),
  },
  {
    q: "I forgot my password.",
    a: <>On the log-in screen, tap &quot;Forgot password?&quot; and we&apos;ll email you a reset link.</>,
  },
  {
    q: "My workouts aren't showing up on another device.",
    a: (
      <>
        Make sure you&apos;re logged in to the same account on both devices and that both are online. Changes made
        offline sync automatically the next time the device connects.
      </>
    ),
  },
  {
    q: "How is the strength percentile calculated?",
    a: (
      <>
        Your best estimated one-rep max (from the Epley formula, using working sets of up to 12 reps) is compared with
        community strength standards for your sex and bodyweight. It&apos;s a rough comparison, not a fitness or
        health assessment.
      </>
    ),
  },
  {
    q: "How should I log dumbbell and bodyweight exercises?",
    a: (
      <>
        Enter the weight of one dumbbell — {APP_NAME} doubles it for stats unless the exercise is single-arm or
        single-leg. For bodyweight moves like pull-ups, enter only the added weight (0 if none).
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      intro={
        <p>
          Need help, found a bug, or have a privacy request? Email{" "}
          <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink> and we&apos;ll get back to you,
          usually within a few days.
        </p>
      }
    >
      <LegalSection title="Frequently asked questions">
        <div className="space-y-5">
          {FAQ.map((item) => (
            <div key={item.q}>
              <p className="font-medium text-foreground">{item.q}</p>
              <p className="mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </LegalSection>
    </LegalPage>
  );
}
