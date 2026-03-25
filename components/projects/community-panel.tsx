"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, MessageSquareText, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { AnnotationItem, IssueItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type CommunityPanelProps = {
  projectSlug: string;
  projectName: string;
};

type LoadState = "idle" | "loading" | "error";

type SubmitState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function StatusMessage({ state }: { state: SubmitState }) {
  if (state.type === "idle") return null;

  return (
    <div
      className={
        state.type === "success"
          ? "accent-panel rounded-[1.25rem] border px-4 py-3 text-sm text-muted"
          : "rounded-[1.25rem] border border-border/80 bg-surface-soft px-4 py-3 text-sm text-muted"
      }
    >
      {state.message}
    </div>
  );
}

export function CommunityPanel({ projectSlug, projectName }: CommunityPanelProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [annotationSubmitting, setAnnotationSubmitting] = useState(false);
  const [redactionSubmitting, setRedactionSubmitting] = useState(false);
  const [issueState, setIssueState] = useState<SubmitState>({ type: "idle" });
  const [annotationState, setAnnotationState] = useState<SubmitState>({ type: "idle" });
  const [redactionState, setRedactionState] = useState<SubmitState>({ type: "idle" });

  const issueFormRef = useRef<HTMLFormElement>(null);
  const annotationFormRef = useRef<HTMLFormElement>(null);
  const redactionFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadState("loading");
        const [issuesResponse, annotationsResponse] = await Promise.all([
          fetch(`/api/issues?projectSlug=${encodeURIComponent(projectSlug)}`),
          fetch(`/api/annotations?projectSlug=${encodeURIComponent(projectSlug)}`)
        ]);

        if (!issuesResponse.ok || !annotationsResponse.ok) {
          throw new Error("Unable to load community activity.");
        }

        const issuesData = (await issuesResponse.json()) as { items: IssueItem[] };
        const annotationsData = (await annotationsResponse.json()) as { items: AnnotationItem[] };

        if (!cancelled) {
          setIssues(issuesData.items);
          setAnnotations(annotationsData.items);
          setLoadState("idle");
        }
      } catch {
        if (!cancelled) {
          setLoadState("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [projectSlug]);

  const publicActivityCount = useMemo(() => issues.length + annotations.length, [issues.length, annotations.length]);

  async function submitIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssueSubmitting(true);
    setIssueState({ type: "idle" });

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          projectSlug
        })
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit issue.");
      }

      issueFormRef.current?.reset();
      setIssueState({
        type: "success",
        message: "Review issue created."
      });
    } catch (error) {
      setIssueState({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit issue."
      });
    } finally {
      setIssueSubmitting(false);
    }
  }

  async function submitAnnotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnnotationSubmitting(true);
    setAnnotationState({ type: "idle" });

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          projectSlug
        })
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit annotation.");
      }

      annotationFormRef.current?.reset();
      setAnnotationState({
        type: "success",
        message: "Review issue created."
      });
    } catch (error) {
      setAnnotationState({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit annotation."
      });
    } finally {
      setAnnotationSubmitting(false);
    }
  }

  async function submitRedaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRedactionSubmitting(true);
    setRedactionState({ type: "idle" });

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/redactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...payload,
          projectSlug
        })
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit redaction request.");
      }

      redactionFormRef.current?.reset();
      setRedactionState({
        type: "success",
        message: "Review issue created."
      });
    } catch (error) {
      setRedactionState({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit redaction request."
      });
    } finally {
      setRedactionSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="section-eyebrow">Community input</p>
        <h2 className="section-title">Corrections, annotations, and private disclosure requests.</h2>
        <p className="section-copy">
          {projectName} has {publicActivityCount} published community item{publicActivityCount === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertCircle className="h-4 w-4 text-accent" />
            Published corrections
          </div>
          <div className="mt-4 space-y-3">
            {loadState === "loading" ? <p className="text-sm text-subtle">Loading moderation history...</p> : null}
            {loadState === "error" ? (
              <p className="text-sm text-subtle">Unable to load public issue history right now.</p>
            ) : null}
            {loadState === "idle" && !issues.length ? (
              <p className="text-sm text-subtle">No public correction or dispute items have been published yet.</p>
            ) : null}
            {issues.map((issue) => (
              <div key={issue.id} className="rounded-[1.25rem] border border-border/80 bg-surface-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base">{issue.title}</h3>
                    <p className="mt-1 text-xs text-faint">Published {formatDate(issue.updatedAt)}</p>
                  </div>
                  <Badge variant={issue.kind === "dispute" ? "outline" : "accent"}>{issue.kind}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted">{issue.detail}</p>
                {issue.evidenceUrl ? (
                  <a
                    href={issue.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm text-accent"
                  >
                    Evidence link
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquareText className="h-4 w-4 text-accent" />
            Published annotations
          </div>
          <div className="mt-4 space-y-3">
            {loadState === "loading" ? <p className="text-sm text-subtle">Loading annotations...</p> : null}
            {loadState === "error" ? (
              <p className="text-sm text-subtle">Unable to load public annotations right now.</p>
            ) : null}
            {loadState === "idle" && !annotations.length ? (
              <p className="text-sm text-subtle">No public annotations have been published yet.</p>
            ) : null}
            {annotations.map((annotation) => (
              <div key={annotation.id} className="rounded-[1.25rem] border border-border/80 bg-surface-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base">Annotation</h3>
                    <p className="mt-1 text-xs text-faint">Published {formatDate(annotation.updatedAt)}</p>
                  </div>
                  {annotation.submissionLanguage ? (
                    <Badge variant="outline">{annotation.submissionLanguage}</Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-muted">{annotation.note}</p>
                {annotation.evidenceUrl ? (
                  <a
                    href={annotation.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm text-accent"
                  >
                    Evidence link
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Upload className="h-4 w-4 text-accent" />
            Submit a correction
          </div>
          <p className="mt-3 text-sm text-subtle">
            Flag a metadata problem or submit a dispute for {projectName}.
          </p>
          <form ref={issueFormRef} onSubmit={submitIssue} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label htmlFor="issueKind" className="meta-label">
                Type
              </label>
              <Select id="issueKind" name="kind" defaultValue="correction">
                <option value="correction">Correction</option>
                <option value="dispute">Dispute</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="issueTitle" className="meta-label">
                Title
              </label>
              <Input id="issueTitle" name="title" required placeholder="Short summary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="issueDetail" className="meta-label">
                Detail
              </label>
              <Textarea id="issueDetail" name="detail" required placeholder="What should change?" />
            </div>
            <div className="space-y-2">
              <label htmlFor="issueEvidenceUrl" className="meta-label">
                Evidence URL
              </label>
              <Input id="issueEvidenceUrl" name="evidenceUrl" type="url" placeholder="Optional public evidence link" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="issueContributorName" className="meta-label">
                  Name
                </label>
                <Input id="issueContributorName" name="contributorName" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label htmlFor="issueContributorEmail" className="meta-label">
                  Email
                </label>
                <Input id="issueContributorEmail" name="contributorEmail" type="email" placeholder="Optional" />
              </div>
            </div>
            <StatusMessage state={issueState} />
            <Button type="submit" disabled={issueSubmitting}>
              {issueSubmitting ? "Submitting..." : "Save issue"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquareText className="h-4 w-4 text-accent" />
            Submit an annotation
          </div>
          <p className="mt-3 text-sm text-subtle">
            Add context without editing the record itself.
          </p>
          <form ref={annotationFormRef} onSubmit={submitAnnotation} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label htmlFor="annotationNote" className="meta-label">
                Annotation
              </label>
              <Textarea id="annotationNote" name="note" required placeholder="Context, caveat, or added evidence" />
            </div>
            <div className="space-y-2">
              <label htmlFor="annotationEvidenceUrl" className="meta-label">
                Evidence URL
              </label>
              <Input
                id="annotationEvidenceUrl"
                name="evidenceUrl"
                type="url"
                placeholder="Optional public evidence link"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="annotationContributorName" className="meta-label">
                  Name
                </label>
                <Input id="annotationContributorName" name="contributorName" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label htmlFor="annotationLanguage" className="meta-label">
                  Submission language
                </label>
                <Input id="annotationLanguage" name="submissionLanguage" placeholder="Optional" />
              </div>
            </div>
            <StatusMessage state={annotationState} />
            <Button type="submit" disabled={annotationSubmitting}>
              {annotationSubmitting ? "Submitting..." : "Save annotation"}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Request restricted disclosure
          </div>
          <p className="mt-3 text-sm text-subtle">
            These requests are private and reviewed for later releases.
          </p>
          <form ref={redactionFormRef} onSubmit={submitRedaction} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label htmlFor="redactionRequesterName" className="meta-label">
                Requester name
              </label>
              <Input id="redactionRequesterName" name="requesterName" required placeholder="Required" />
            </div>
            <div className="space-y-2">
              <label htmlFor="redactionRequesterEmail" className="meta-label">
                Requester email
              </label>
              <Input id="redactionRequesterEmail" name="requesterEmail" type="email" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <label htmlFor="redactionRelationship" className="meta-label">
                Relationship to project
              </label>
              <Input id="redactionRelationship" name="relationshipToProject" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <label htmlFor="redactionFields" className="meta-label">
                Fields to restrict
              </label>
              <Input
                id="redactionFields"
                name="fieldsToRestrict"
                placeholder="Optional, e.g. city, organization, link"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="redactionReason" className="meta-label">
                Reason
              </label>
              <Textarea id="redactionReason" name="reason" required placeholder="Explain the requested restriction" />
            </div>
            <StatusMessage state={redactionState} />
            <Button type="submit" disabled={redactionSubmitting}>
              {redactionSubmitting ? "Submitting..." : "Save request"}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
