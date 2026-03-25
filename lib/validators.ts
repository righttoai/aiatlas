import crypto from "node:crypto";
import {
  AnnotationItem,
  IssueItem,
  RedactionItem,
  SchemaFeedbackItem,
  SubmissionItem
} from "@/lib/types";

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

function asOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function asRequiredString(value: unknown, field: string) {
  const parsed = asOptionalString(value);
  if (!parsed) {
    throw new InputValidationError(`Missing required field: ${field}`);
  }
  return parsed;
}

function asOptionalUrl(value: unknown) {
  const parsed = asOptionalString(value);
  if (!parsed) return null;

  try {
    return new URL(parsed).toString();
  } catch {
    throw new InputValidationError("Invalid URL.");
  }
}

function baseRecord(publicValue: boolean) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "pending" as const,
    public: publicValue
  };
}

export function validateIssueInput(payload: unknown): IssueItem {
  const body = payload as Record<string, unknown>;

  return {
    ...baseRecord(true),
    projectSlug: asRequiredString(body.projectSlug, "projectSlug"),
    kind: asRequiredString(body.kind, "kind") === "dispute" ? "dispute" : "correction",
    title: asRequiredString(body.title, "title"),
    detail: asRequiredString(body.detail, "detail"),
    evidenceUrl: asOptionalUrl(body.evidenceUrl),
    contributorName: asOptionalString(body.contributorName),
    contributorEmail: asOptionalString(body.contributorEmail)
  };
}

export function validateAnnotationInput(payload: unknown): AnnotationItem {
  const body = payload as Record<string, unknown>;

  return {
    ...baseRecord(true),
    projectSlug: asRequiredString(body.projectSlug, "projectSlug"),
    note: asRequiredString(body.note, "note"),
    evidenceUrl: asOptionalUrl(body.evidenceUrl),
    contributorName: asOptionalString(body.contributorName),
    submissionLanguage: asOptionalString(body.submissionLanguage)
  };
}

export function validateRedactionInput(payload: unknown): RedactionItem {
  const body = payload as Record<string, unknown>;

  return {
    ...baseRecord(false),
    projectSlug: asRequiredString(body.projectSlug, "projectSlug"),
    requesterName: asRequiredString(body.requesterName, "requesterName"),
    requesterEmail: asOptionalString(body.requesterEmail),
    relationshipToProject: asOptionalString(body.relationshipToProject),
    fieldsToRestrict: asOptionalString(body.fieldsToRestrict),
    reason: asRequiredString(body.reason, "reason")
  };
}

export function validateSubmissionInput(payload: unknown): SubmissionItem {
  const body = payload as Record<string, unknown>;

  return {
    ...baseRecord(false),
    projectName: asRequiredString(body.projectName, "projectName"),
    provenanceUrl: asOptionalUrl(body.provenanceUrl) ?? asRequiredString(body.provenanceUrl, "provenanceUrl"),
    country: asRequiredString(body.country, "country"),
    city: asOptionalString(body.city),
    leadOrg: asOptionalString(body.leadOrg),
    aiComponent: asRequiredString(body.aiComponent, "aiComponent"),
    participationLocus: asRequiredString(body.participationLocus, "participationLocus"),
    participationMechanism: asRequiredString(body.participationMechanism, "participationMechanism"),
    decisionInfluence: asRequiredString(body.decisionInfluence, "decisionInfluence"),
    notes: asOptionalString(body.notes),
    contributorName: asOptionalString(body.contributorName),
    contributorEmail: asOptionalString(body.contributorEmail),
    submissionLanguage: asOptionalString(body.submissionLanguage)
  };
}

export function validateSchemaFeedbackInput(payload: unknown): SchemaFeedbackItem {
  const body = payload as Record<string, unknown>;

  return {
    ...baseRecord(false),
    focusArea: asRequiredString(body.focusArea, "focusArea"),
    recommendation: asRequiredString(body.recommendation, "recommendation"),
    rationale: asOptionalString(body.rationale),
    contributorName: asOptionalString(body.contributorName),
    contributorEmail: asOptionalString(body.contributorEmail)
  };
}
