"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

type StatusState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function SchemaFeedbackForm() {
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
      const response = await fetch("/api/schema-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit schema feedback.");
      }

      formRef.current?.reset();
      setStatus({
        type: "success",
        message: "Review issue created."
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit schema feedback."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4">
        <div className="space-y-2">
          <label htmlFor="focusArea" className="meta-label">
            Focus area
          </label>
          <Select id="focusArea" name="focusArea" required defaultValue="record-fields">
            <option value="record-fields">Record fields</option>
            <option value="participation-documentation">Participation documentation requirements</option>
            <option value="moderation-workflow">Moderation workflow</option>
            <option value="release-governance">Release and archival workflow</option>
            <option value="coverage-bias">Coverage bias and multilingual intake</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="recommendation" className="meta-label">
            Recommendation
          </label>
          <Textarea
            id="recommendation"
            name="recommendation"
            required
            className="min-h-[110px]"
            placeholder="What should change?"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="rationale" className="meta-label">
            Rationale
          </label>
          <Textarea
            id="rationale"
            name="rationale"
            className="min-h-[110px]"
            placeholder="Why does this matter?"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="schemaContributorName" className="meta-label">
              Contributor name
            </label>
            <Input id="schemaContributorName" name="contributorName" placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <label htmlFor="schemaContributorEmail" className="meta-label">
              Contributor email
            </label>
            <Input id="schemaContributorEmail" name="contributorEmail" type="email" placeholder="Optional" />
          </div>
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
        <p className="text-sm text-subtle">Creates a review issue.</p>
        <Button type="submit" disabled={submitting}>
          <MessageSquareMore className="mr-2 h-4 w-4" />
          {submitting ? "Submitting..." : "Submit feedback"}
        </Button>
      </div>
    </form>
  );
}
