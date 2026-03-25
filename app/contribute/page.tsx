import type { Metadata } from "next";
import Link from "next/link";
import { ContributionForm } from "@/components/forms/contribution-form";
import { SchemaFeedbackForm } from "@/components/forms/schema-feedback-form";
import { Card } from "@/components/ui/card";
import { getSchema } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Submit a project or suggest a schema change for the participatory AI atlas."
};

export default async function ContributePage() {
  const schema = await getSchema();
  const requiredFields = schema.minimalParticipationDocumentation.filter((field) => field.requiredForContribution);

  return (
    <div className="page-shell space-y-8 py-8 sm:py-10">
      <section className="space-y-2">
        <h1 className="text-4xl font-medium leading-tight text-foreground sm:text-5xl">Contribute</h1>
        <p className="max-w-2xl text-base text-muted">Submit a record or suggest a schema change.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <Card>
          <div className="meta-label">New record</div>
          <h2 className="mt-3 text-2xl text-foreground">Project submission</h2>
          <div className="mt-6">
            <ContributionForm />
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="meta-label">Minimum</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {requiredFields.map((field) => (
                <span
                  key={field.key}
                  className="rounded-full border border-border/80 bg-surface-soft px-3 py-2 text-sm text-subtle"
                >
                  {field.label}
                </span>
              ))}
            </div>
            <Link href="/atlas" className="mt-5 inline-flex text-sm font-medium text-accent">
              View atlas
            </Link>
          </Card>

          <Card>
            <div className="meta-label">Schema</div>
            <h2 className="mt-3 text-2xl text-foreground">Schema feedback</h2>
            <p className="mt-3 max-w-2xl text-sm text-subtle">Use this for structure changes, not record corrections.</p>
            <div className="mt-6">
              <SchemaFeedbackForm />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
