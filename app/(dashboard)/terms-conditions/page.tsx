import { Card } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

const sections = [
  {
    title: "1. Use of the App",
    paragraphs: [
      `${APP_NAME} is used to manage construction projects, teams, timelines, updates, and project documents.`,
      "You agree to use the dashboard only for legitimate business and operational purposes.",
    ],
    bullets: [
      "Share project updates",
      "Track project progress",
      "Manage tasks and deliverables",
      "Store and review project-related documents",
    ],
  },
  {
    title: "2. User Account",
    paragraphs: [
      "Some features require an authorized account.",
      "You are responsible for keeping your login credentials secure and for activity performed through your account.",
    ],
    bullets: [
      "Provide accurate account information",
      "Protect your email and password",
      "Report unauthorized access promptly",
    ],
  },
  {
    title: "3. User Content",
    paragraphs: [
      "Users may upload project updates, comments, images, files, and related operational data.",
      "By submitting content, you confirm that you have the right to share it and that it does not violate applicable law or third-party rights.",
    ],
  },
  {
    title: "4. Intellectual Property",
    paragraphs: [
      `All software, branding, interface designs, and platform features within ${APP_NAME} remain the property of the service owner unless otherwise stated.`,
      "You may not copy, resell, or distribute protected materials without permission.",
    ],
  },
  {
    title: "5. Acceptable Use",
    bullets: [
      "Do not use the platform for unlawful activity",
      "Do not upload harmful, misleading, or unauthorized content",
      "Do not attempt to access restricted systems or data",
      "Do not interfere with normal platform operation",
    ],
  },
  {
    title: "6. Availability of Service",
    paragraphs: [
      "We aim to keep the dashboard available, but access may be interrupted for maintenance, updates, or technical issues.",
    ],
  },
  {
    title: "7. Limitation of Liability",
    paragraphs: [
      "The dashboard is provided on an as-is basis. To the extent permitted by law, we are not liable for direct or indirect loss arising from platform use, interruption, or data issues.",
    ],
  },
  {
    title: "8. Account Suspension or Termination",
    paragraphs: [
      "Access may be suspended or removed if these terms are violated or if continued access creates security or operational risk.",
    ],
  },
  {
    title: "9. Changes to These Terms",
    paragraphs: [
      "These terms may be updated from time to time. Continued use of the dashboard after updates means you accept the revised terms.",
    ],
  },
];

export default function TermsConditionsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <h2 className="text-[40px] font-bold leading-tight text-white">Terms & Conditions</h2>
        <p className="text-sm uppercase tracking-[0.2em] text-white/45">Last updated: April 2026</p>
        <p className="max-w-3xl text-white/70">
          Welcome to <span className="font-semibold text-white">{APP_NAME}</span>. By accessing or
          using this dashboard, you agree to the terms below.
        </p>
      </header>

      <Card className="space-y-8 border-white/10 bg-[#111c22] p-6 md:p-8">
        {sections.map((section) => (
          <section key={section.title} className="space-y-4 border-b border-white/10 pb-8 last:border-b-0 last:pb-0">
            <h3 className="text-xl font-semibold text-white">{section.title}</h3>

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-white/70 md:text-base">
                {paragraph}
              </p>
            ))}

            {section.bullets ? (
              <ul className="space-y-3 pl-5 text-sm leading-7 text-white/70 md:text-base">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="list-disc">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="rounded-2xl border border-[#2f3c44] bg-[#0d171c] p-5">
          <h3 className="text-xl font-semibold text-white">10. Contact</h3>
          <p className="mt-3 text-sm leading-7 text-white/70 md:text-base">
            For questions about these terms, contact the platform administrator or support team
            responsible for {APP_NAME}.
          </p>
        </section>
      </Card>
    </div>
  );
}
