export type OrganizationType = string;

export type ActivityStatusGroup = string;

export type TechnologyGroup = string;

export type ParticipationModeGroup = string;

export type DocumentationLevel = "Low missingness" | "Medium missingness" | "High missingness";

export interface EditLogEntry {
  id: string;
  type: "import" | "metadata-update" | "release" | "manual-review";
  date: string;
  summary: string;
  detail?: string;
}

export interface ProjectCompleteness {
  score: number;
  filled: number;
  total: number;
  presentFields: string[];
  missingFields: string[];
}

export interface AtlasProject {
  slug: string;
  projectName: string;
  normalizedName: string;
  category: string | null;
  secondaryCategory: string | null;
  tags: string[];
  city: string | null;
  country: string | null;
  countryNormalized: string | null;
  region: string;
  multiCountry: boolean;
  latitude: number | null;
  longitude: number | null;
  coordinates: [number, number] | null;
  leadOrg: string | null;
  organizationType: OrganizationType;
  activityStatus: string | null;
  activityStatusGroup: ActivityStatusGroup;
  technology: string | null;
  technologyGroup: TechnologyGroup;
  participationMode: string | null;
  participationModeGroup: ParticipationModeGroup;
  participationDocumented: boolean;
  participationSpecificity: "Specific" | "Unspecified";
  startYear: number | null;
  funding: string | null;
  regionProjectActivity: string | null;
  description: string | null;
  provenanceUrl: string;
  projectDocumentationLink: string | null;
  additionalLinks: string[];
  officialUrl: string | null;
  sourceLinks: Array<{
    url: string;
    type: string | null;
  }>;
  provenanceDomain: string | null;
  sourceOrigin: string;
  sourceFile: string | null;
  sourceSheet: string | null;
  documentationCompleteness: ProjectCompleteness;
  dataRights: {
    redactionSupported: true;
    restrictedDisclosureSupported: true;
  };
  recordVersion: string;
  lastUpdated: string;
  recordType: string | null;
  partnerOrgs: string | null;
  scope: string | null;
  endYear: number | null;
  locationPrecision: string | null;
  applicationDomain: string | null;
  participants: string | null;
  participationMethods: string | null;
  aiLifecycleStages: string | null;
  participationTier: string | null;
  participationStrength: string | null;
  washingRisk: string | null;
  theoreticalLenses: string[];
  verificationStatus: string | null;
  participatoryEvidence: string | null;
  note: string | null;
  legacyParticipatoryStatus: string | null;
  participatoryStatus: string | null;
  atlasDecision: string | null;
  participatoryConfidence: string | null;
  evidenceGrade: string | null;
  uncertaintyReason: string | null;
  sourceSeed: string | null;
  reviewStatus: string | null;
  editLog: EditLogEntry[];
}

export interface FieldCompletenessStat {
  field: string;
  label: string;
  present: number;
  total: number;
  percent: number;
  missingnessLevel: DocumentationLevel;
}

export interface CountStat {
  name: string;
  count: number;
}

export interface AtlasStats {
  generatedAt: string;
  paperReported: {
    totalProjects: number;
    normalizedCountries: number;
    coreProjects: number;
    cautiousProjects: number;
    reviewCandidates: number;
    readyProjects: number;
  };
  dataDerived: {
    totalProjects: number;
    normalizedCountries: number;
    tags: number;
    categories: number;
  };
  fieldCompleteness: FieldCompletenessStat[];
  regions: CountStat[];
  countries: CountStat[];
  categories: CountStat[];
  organizationTypes: CountStat[];
  technologyGroups: CountStat[];
  activityStatusGroups: CountStat[];
  participationModes: CountStat[];
  atlasDecisions: CountStat[];
  reviewStatuses: CountStat[];
  topTags: CountStat[];
}

export interface ReleaseArtifact {
  label: string;
  path: string;
  bytes: number;
}

export interface AtlasRelease {
  id: string;
  label: string;
  date: string;
  recordCount: number;
  normalizedCountries: number;
  checksum: string;
  sourceFiles: string[];
  citation: string;
  notes: string[];
  artifacts: ReleaseArtifact[];
}

export interface SchemaField {
  key: string;
  label: string;
  description: string;
  requiredForContribution: boolean;
  publicByDefault: boolean;
}

export interface AtlasSchema {
  version: string;
  generatedAt: string;
  minimalParticipationDocumentation: SchemaField[];
  recordFields: SchemaField[];
}

export interface FilterState {
  q: string;
  regions: string[];
  countries: string[];
  categories: string[];
  tags: string[];
  organizationTypes: string[];
  technologyGroups: string[];
  activityStatusGroups: string[];
  participationModes: string[];
  participationVisibility: "all" | "documented" | "undocumented";
  fundingPresence: "all" | "funded" | "not-funded";
  sort: "name-asc" | "country-asc" | "completeness-desc";
}

export type RuntimeCollectionName =
  | "issues"
  | "annotations"
  | "redactions"
  | "submissions"
  | "schema-feedback";

export interface BaseRuntimeItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "published" | "resolved";
  public: boolean;
}

export interface IssueItem extends BaseRuntimeItem {
  projectSlug: string;
  kind: "correction" | "dispute";
  title: string;
  detail: string;
  evidenceUrl: string | null;
  contributorName: string | null;
  contributorEmail: string | null;
}

export interface AnnotationItem extends BaseRuntimeItem {
  projectSlug: string;
  note: string;
  evidenceUrl: string | null;
  contributorName: string | null;
  submissionLanguage: string | null;
}

export interface RedactionItem extends BaseRuntimeItem {
  projectSlug: string;
  requesterName: string;
  requesterEmail: string | null;
  relationshipToProject: string | null;
  fieldsToRestrict: string | null;
  reason: string;
}

export interface SubmissionItem extends BaseRuntimeItem {
  projectName: string;
  provenanceUrl: string;
  country: string;
  city: string | null;
  leadOrg: string | null;
  aiComponent: string;
  participationLocus: string;
  participationMechanism: string;
  decisionInfluence: string;
  notes: string | null;
  contributorName: string | null;
  contributorEmail: string | null;
  submissionLanguage: string | null;
}

export interface SchemaFeedbackItem extends BaseRuntimeItem {
  focusArea: string;
  recommendation: string;
  rationale: string | null;
  contributorName: string | null;
  contributorEmail: string | null;
}
