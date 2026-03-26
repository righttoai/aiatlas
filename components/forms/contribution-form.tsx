"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

type StatusState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function ContributionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit the record.");
      }

      formRef.current?.reset();
      setStatus({
        type: "success",
        message:
          "Thank you for contributing a record. We opened a review issue and draft pull request so the atlas team can take it forward."
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit the record."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="projectName" className="meta-label">
            Project name
          </label>
          <Input id="projectName" name="projectName" required placeholder="Name of the participatory AI project" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="provenanceUrl" className="meta-label">
            Provenance URL
          </label>
          <Input
            id="provenanceUrl"
            name="provenanceUrl"
            type="url"
            required
            placeholder="Public source for this record"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="country" className="meta-label">
            Country
          </label>
          <Input id="country" name="country" required placeholder="Country" />
        </div>

        <div className="space-y-2">
          <label htmlFor="city" className="meta-label">
            City
          </label>
          <Input id="city" name="city" placeholder="Optional" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="leadOrg" className="meta-label">
            Lead organization
          </label>
          <Input id="leadOrg" name="leadOrg" placeholder="Optional" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="aiComponent" className="meta-label">
            AI component or technical modality
          </label>
          <Textarea
            id="aiComponent"
            name="aiComponent"
            required
            placeholder="What AI system or component is involved?"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="participationLocus" className="meta-label">
            Participation locus
          </label>
          <Textarea
            id="participationLocus"
            name="participationLocus"
            required
            placeholder="Where does participation happen in the lifecycle?"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="participationMechanism" className="meta-label">
            Participation mechanism
          </label>
          <Textarea
            id="participationMechanism"
            name="participationMechanism"
            required
            placeholder="What mechanism turns input into decisions?"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="decisionInfluence" className="meta-label">
            Decision influence
          </label>
          <Textarea
            id="decisionInfluence"
            name="decisionInfluence"
            required
            placeholder="How did the input affect decisions?"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="meta-label">
            Notes
          </label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Optional context or caveats"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contributorName" className="meta-label">
            Contributor name
          </label>
          <Input id="contributorName" name="contributorName" placeholder="Optional" />
        </div>

        <div className="space-y-2">
          <label htmlFor="contributorEmail" className="meta-label">
            Contributor email
          </label>
          <Input id="contributorEmail" name="contributorEmail" type="email" placeholder="Optional" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="submissionLanguage" className="meta-label">
            Submission language
          </label>
          <Input
            id="submissionLanguage"
            name="submissionLanguage"
            placeholder="Optional"
          />
        </div>
      </div>

      {status.type !== "idle" ? (
        <div
          className={
            status.type === "success"
              ? "accent-panel rounded-[1.25rem] border px-4 py-3 text-sm text-muted"
              : "rounded-[1.25rem] border border-border/80 bg-surface-soft px-4 py-3 text-sm text-muted"
          }
        >
          {status.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-subtle">Creates a review issue and draft pull request.</p>
        <Button type="submit" disabled={submitting}>
          <Send className="mr-2 h-4 w-4" />
          {submitting ? "Submitting..." : "Submit record"}
        </Button>
      </div>
    </form>
  );
}
