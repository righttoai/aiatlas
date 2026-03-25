import "server-only";

import { parse } from "csv-parse/sync";
import type {
  AnnotationItem,
  IssueItem,
  RedactionItem,
  SchemaFeedbackItem,
  SubmissionItem
} from "@/lib/types";

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
  datasetPath: string;
  includeContributorEmails: boolean;
  includeSensitiveRedactions: boolean;
};

type GitHubIssueResponse = {
  number: number;
  html_url: string;
};

type GitHubPullRequestResponse = {
  number: number;
  html_url: string;
};

type GitHubRefResponse = {
  object: {
    sha: string;
  };
};

type GitHubContentResponse = {
  sha: string;
  encoding: string;
  content: string;
};

class ModerationConfigurationError extends Error {
  status: number;

  constructor(message: string, status = 503) {
    super(message);
    this.name = "ModerationConfigurationError";
    this.status = status;
  }
}

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ModerationConfigurationError(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getConfig(): GitHubConfig {
  return {
    token: readRequiredEnv("GITHUB_TOKEN"),
    owner: readRequiredEnv("GITHUB_OWNER"),
    repo: readRequiredEnv("GITHUB_REPO"),
    baseBranch: process.env.GITHUB_BASE_BRANCH?.trim() || "main",
    datasetPath:
      process.env.GITHUB_ATLAS_DATASET_PATH?.trim() ||
      "data/raw/participatory_ai_atlas_expanded_2026-03-23.csv",
    includeContributorEmails: process.env.GITHUB_INCLUDE_CONTRIBUTOR_EMAILS === "true",
    includeSensitiveRedactions: process.env.GITHUB_INCLUDE_SENSITIVE_REDACTIONS === "true"
  };
}

function encodeGitHubPath(filePath: string) {
  return filePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function encodeGitRef(ref: string) {
  return ref.replace(/\//g, "%2F");
}

async function githubRequest<T>(pathname: string, init?: RequestInit): Promise<T> {
  const config = getConfig();
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "User-Agent": "participatory-ai-atlas",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `GitHub request failed with status ${response.status}.`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parsing errors and keep the default message.
    }

    throw new ModerationConfigurationError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function escapeMarkdown(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function formatField(label: string, value: string | null | undefined) {
  if (!value) return null;
  return `- **${label}:** ${escapeMarkdown(value)}`;
}

function formatSection(title: string, lines: Array<string | null>) {
  const filtered = lines.filter(Boolean);
  if (!filtered.length) return "";
  return `## ${title}\n${filtered.join("\n")}`;
}

function buildContributorLines(
  contributorName: string | null | undefined,
  contributorEmail: string | null | undefined,
  includeEmail: boolean
) {
  return [
    formatField("Contributor name", contributorName),
    includeEmail ? formatField("Contributor email", contributorEmail) : null
  ];
}

function csvEscape(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function appendCsvRow(csvContent: string, record: Record<string, string>) {
  const parsed = parse(csvContent, {
    relax_column_count: true,
    to_line: 1
  }) as string[][];

  const header = parsed[0];

  if (!header?.length) {
    throw new ModerationConfigurationError("Unable to read the atlas CSV header.");
  }

  const row = header.map((column) => csvEscape(record[column] ?? "")).join(",");
  const normalizedContent = csvContent.endsWith("\n") ? csvContent : `${csvContent}\n`;

  return `${normalizedContent}${row}\n`;
}

async function createIssue(title: string, body: string) {
  return githubRequest<GitHubIssueResponse>(`/repos/${getConfig().owner}/${getConfig().repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title,
      body
    })
  });
}

async function createIssueComment(issueNumber: number, body: string) {
  return githubRequest<unknown>(
    `/repos/${getConfig().owner}/${getConfig().repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body })
    }
  );
}

async function getHeadSha(branch: string) {
  const response = await githubRequest<GitHubRefResponse>(
    `/repos/${getConfig().owner}/${getConfig().repo}/git/ref/heads/${encodeGitRef(branch)}`
  );
  return response.object.sha;
}

async function createBranch(branch: string, sha: string) {
  return githubRequest<unknown>(`/repos/${getConfig().owner}/${getConfig().repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha
    })
  });
}

async function getRepositoryFile(filePath: string, ref: string) {
  const response = await githubRequest<GitHubContentResponse>(
    `/repos/${getConfig().owner}/${getConfig().repo}/contents/${encodeGitHubPath(filePath)}?ref=${encodeURIComponent(ref)}`
  );

  if (response.encoding !== "base64") {
    throw new ModerationConfigurationError(`Unsupported GitHub file encoding: ${response.encoding}`);
  }

  return {
    sha: response.sha,
    content: Buffer.from(response.content.replace(/\n/g, ""), "base64").toString("utf8")
  };
}

async function commitRepositoryFile(params: {
  filePath: string;
  branch: string;
  message: string;
  sha: string;
  content: string;
}) {
  const { filePath, branch, message, sha, content } = params;

  return githubRequest<unknown>(
    `/repos/${getConfig().owner}/${getConfig().repo}/contents/${encodeGitHubPath(filePath)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        branch,
        sha,
        content: Buffer.from(content, "utf8").toString("base64")
      })
    }
  );
}

async function createPullRequest(params: {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}) {
  return githubRequest<GitHubPullRequestResponse>(`/repos/${getConfig().owner}/${getConfig().repo}/pulls`, {
    method: "POST",
    body: JSON.stringify(params)
  });
}

function buildSubmissionIssueBody(item: SubmissionItem) {
  const config = getConfig();

  return [
    "A new project record was submitted through the public atlas form.",
    "",
    formatSection("Record", [
      formatField("Project name", item.projectName),
      formatField("Country", item.country),
      formatField("City", item.city),
      formatField("Lead organization", item.leadOrg),
      formatField("Provenance URL", item.provenanceUrl),
      formatField("Submission language", item.submissionLanguage)
    ]),
    "",
    formatSection("Participation", [
      formatField("AI component", item.aiComponent),
      formatField("Participation locus", item.participationLocus),
      formatField("Participation mechanism", item.participationMechanism),
      formatField("Decision influence", item.decisionInfluence),
      formatField("Notes", item.notes)
    ]),
    "",
    formatSection(
      "Submitter",
      buildContributorLines(item.contributorName, item.contributorEmail, config.includeContributorEmails)
    ),
    "",
    `Submission ID: \`${item.id}\``
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSchemaFeedbackIssueBody(item: SchemaFeedbackItem) {
  const config = getConfig();

  return [
    "Schema feedback submitted through the public atlas form.",
    "",
    formatSection("Feedback", [
      formatField("Focus area", item.focusArea),
      formatField("Recommendation", item.recommendation),
      formatField("Rationale", item.rationale)
    ]),
    "",
    formatSection(
      "Submitter",
      buildContributorLines(item.contributorName, item.contributorEmail, config.includeContributorEmails)
    ),
    "",
    `Submission ID: \`${item.id}\``
  ]
    .filter(Boolean)
    .join("\n");
}

function buildProjectIssueBody(item: IssueItem, projectName: string) {
  const config = getConfig();

  return [
    "Project correction or dispute submitted through the public atlas form.",
    "",
    formatSection("Record", [
      formatField("Project", projectName),
      formatField("Project slug", item.projectSlug),
      formatField("Type", item.kind),
      formatField("Title", item.title),
      formatField("Detail", item.detail),
      formatField("Evidence URL", item.evidenceUrl)
    ]),
    "",
    formatSection(
      "Submitter",
      buildContributorLines(item.contributorName, item.contributorEmail, config.includeContributorEmails)
    ),
    "",
    `Submission ID: \`${item.id}\``
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAnnotationIssueBody(item: AnnotationItem, projectName: string) {
  const config = getConfig();

  return [
    "Project annotation submitted through the public atlas form.",
    "",
    formatSection("Record", [
      formatField("Project", projectName),
      formatField("Project slug", item.projectSlug),
      formatField("Annotation", item.note),
      formatField("Evidence URL", item.evidenceUrl),
      formatField("Submission language", item.submissionLanguage)
    ]),
    "",
    formatSection(
      "Submitter",
      buildContributorLines(item.contributorName, null, config.includeContributorEmails)
    ),
    "",
    `Submission ID: \`${item.id}\``
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRedactionIssueBody(item: RedactionItem, projectName: string) {
  const config = getConfig();
  const exposeSensitiveFields = config.includeSensitiveRedactions;

  return [
    "Restricted disclosure request submitted through the public atlas form.",
    "",
    formatSection("Record", [
      formatField("Project", projectName),
      formatField("Project slug", item.projectSlug),
      formatField("Requester name", item.requesterName),
      config.includeContributorEmails ? formatField("Requester email", item.requesterEmail) : null,
      formatField("Relationship to project", item.relationshipToProject),
      exposeSensitiveFields ? formatField("Fields to restrict", item.fieldsToRestrict) : null,
      exposeSensitiveFields ? formatField("Reason", item.reason) : null
    ]),
    exposeSensitiveFields
      ? ""
      : "_Sensitive request details were intentionally omitted from the GitHub issue body. Set `GITHUB_INCLUDE_SENSITIVE_REDACTIONS=true` only when the moderation repository is private._",
    "",
    `Submission ID: \`${item.id}\``
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSubmissionCsvRecord(item: SubmissionItem, issueNumber: number) {
  const reviewNoteParts = [
    `Submitted via the public atlas form and linked to review issue #${issueNumber}.`,
    `AI component: ${item.aiComponent}`,
    `Participation locus: ${item.participationLocus}`,
    `Decision influence: ${item.decisionInfluence}`
  ];

  if (item.notes) {
    reviewNoteParts.push(`Submitter notes: ${item.notes}`);
  }

  if (item.contributorName) {
    reviewNoteParts.push(`Contributor: ${item.contributorName}`);
  }

  return {
    project_name: item.projectName,
    category: "",
    city: item.city ?? "",
    country: item.country,
    latitude: "",
    longitude: "",
    lead_org: item.leadOrg ?? "",
    participation_mode: item.participationMechanism,
    start_year: "",
    provenance_url: item.provenanceUrl,
    official_url: item.provenanceUrl,
    source_url_1: item.provenanceUrl,
    source_type_1: "form_submission",
    source_url_2: "",
    source_type_2: "",
    source_url_3: "",
    source_type_3: "",
    record_type: "submitted_record",
    lead_org_type: "",
    partner_orgs: "",
    region: "",
    scope: item.participationLocus,
    status: "submitted",
    end_year: "",
    location_precision: item.city ? "city" : "country",
    ai_modality: item.aiComponent,
    application_domain: "",
    participants: "",
    participation_methods: item.participationMechanism,
    ai_lifecycle_stages: item.participationLocus,
    participation_tier: "under_review",
    participation_strength: "",
    washing_risk: "",
    theoretical_lenses: "",
    verification_status: "submitted_via_form",
    participatory_evidence: item.decisionInfluence,
    notes: reviewNoteParts.join(" "),
    last_verified: item.createdAt.slice(0, 10),
    legacy_participatory_status: "",
    participatory_status: "review_candidate",
    atlas_decision: "review_candidate",
    participatory_confidence: "pending_review",
    evidence_grade: "",
    uncertainty_reason: "Submitted through the public form and awaiting editorial review.",
    source_seed: "web_form_submission",
    review_status: "pending_review"
  };
}

export async function submitProjectContribution(item: SubmissionItem) {
  const config = getConfig();
  const issue = await createIssue(`Submission: ${item.projectName}`, buildSubmissionIssueBody(item));
  const branch = `atlas-submission/${item.id}`;
  const baseSha = await getHeadSha(config.baseBranch);
  await createBranch(branch, baseSha);

  const file = await getRepositoryFile(config.datasetPath, config.baseBranch);
  const nextContent = appendCsvRow(file.content, buildSubmissionCsvRecord(item, issue.number));

  await commitRepositoryFile({
    filePath: config.datasetPath,
    branch,
    sha: file.sha,
    message: `Add draft atlas submission for ${item.projectName}`,
    content: nextContent
  });

  const pullRequest = await createPullRequest({
    title: `Add draft submission: ${item.projectName}`,
    body: [
      "Automated draft PR opened from the public atlas submission form.",
      "",
      `- Review issue: #${issue.number}`,
      `- Project: ${item.projectName}`,
      `- Country: ${item.country}`,
      `- Provenance URL: ${item.provenanceUrl}`,
      "",
      "The appended CSV row is intentionally marked as a review candidate. Review and edit the row before merging."
    ].join("\n"),
    head: branch,
    base: config.baseBranch,
    draft: true
  });

  await createIssueComment(
    issue.number,
    `A draft pull request has been created for review: ${pullRequest.html_url}`
  );

  return {
    issueUrl: issue.html_url,
    pullRequestUrl: pullRequest.html_url
  };
}

export async function submitSchemaFeedback(item: SchemaFeedbackItem) {
  const issue = await createIssue(`Schema feedback: ${item.focusArea}`, buildSchemaFeedbackIssueBody(item));

  return {
    issueUrl: issue.html_url
  };
}

export async function submitProjectIssue(item: IssueItem, projectName: string) {
  const issue = await createIssue(
    `${item.kind === "dispute" ? "Dispute" : "Correction"}: ${projectName}`,
    buildProjectIssueBody(item, projectName)
  );

  return {
    issueUrl: issue.html_url
  };
}

export async function submitProjectAnnotation(item: AnnotationItem, projectName: string) {
  const issue = await createIssue(`Annotation: ${projectName}`, buildAnnotationIssueBody(item, projectName));

  return {
    issueUrl: issue.html_url
  };
}

export async function submitRedactionRequest(item: RedactionItem, projectName: string) {
  const issue = await createIssue(
    `Restricted disclosure request: ${projectName}`,
    buildRedactionIssueBody(item, projectName)
  );

  return {
    issueUrl: issue.html_url
  };
}

export function getModerationErrorMessage(error: unknown) {
  if (error instanceof ModerationConfigurationError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "Unable to complete the moderation workflow.";
}

export function getModerationErrorStatus(error: unknown) {
  if (error instanceof ModerationConfigurationError) {
    return error.status;
  }

  return 500;
}
