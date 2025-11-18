import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "Legal Notice (Impressum) – The Hidden Gaming Lair",
  description:
    "Legal information and website ownership details for The Hidden Gaming Lair. Provided in accordance with § 5 TMG (Germany).",
  alternates: {
    canonical: "/legal-notice",
  },
};

export default function LegalNotice(): JSX.Element {
  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold">
          Legal Notice / Impressum
        </h1>
        <p className="text-muted-foreground">
          Angaben gemäß § 5 TMG / In accordance with Section 5 of the German
          Telemedia Act.
        </p>
      </div>

      <hr className="border-border" />

      {/* Website Owner Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Website Owner</h2>
        <p className="text-muted-foreground">Leon Machens</p>
      </section>

      <hr className="border-border" />

      {/* Contact Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Contact</h2>
        <div className="space-y-2 text-muted-foreground">
          <p>
            Email:{" "}
            <span className="select-all text-foreground">
              leon (at) th (dot) gl
            </span>
          </p>
          <p>
            Discord:{" "}
            <a
              href="https://th.gl/discord"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              devleon
            </a>
          </p>
        </div>
      </section>

      <hr className="border-border" />

      {/* Disclaimer Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Disclaimer</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            This is a commercial project. Revenue is generated through ads and
            subscriptions.
          </p>
          <p>
            Content responsibility in accordance with § 55 Abs. 2 RStV: Leon
            Machens, Nottuln, Germany.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
