import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, "data", "raw");
const GENERATED_DIR = path.join(ROOT, "data", "generated");
const RELEASES_DIR = path.join(ROOT, "data", "releases");
const RUNTIME_DIR = path.join(ROOT, "data", "runtime");
const PUBLIC_DOWNLOADS_DIR = path.join(ROOT, "public", "downloads");
const SOURCE_DATASET_FILE = "participatory_ai_atlas_expanded_2026-03-23.csv";
const RELEASE_ID = "2026-03-23";
const RELEASE_DATE = "2026-03-23";
const SOURCE_ORIGIN = "Vetted atlas dataset";

const MISSINGNESS_THRESHOLDS = {
  high: 70,
  medium: 30
};

function normalizeText(value) {
  return (value ?? "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const trimmed = value.toString().trim();
  return trimmed.length ? trimmed : null;
}

function normalizeName(value) {
  return normalizeText(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeName(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function maybeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function maybeInteger(value) {
  const number = maybeNumber(value);
  return number === null ? null : Math.round(number);
}

function unique(values) {
  return [...new Set(values)];
}

function parseList(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return [];

  return unique(
    cleaned
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function formatFacetValue(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;

  const spaced = cleaned.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (/[A-Z]/.test(spaced.slice(1))) return spaced;

  return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortCountsDescending(items) {
  return [...items].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });
}

function countByName(values) {
  const counts = new Map();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return sortCountsDescending([...counts.entries()].map(([name, count]) => ({ name, count })));
}

function countryNormalized(value) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;

  const map = new Map([
    ["usa", "United States"],
    ["united states", "United States"],
    ["uk", "United Kingdom"],
    ["united kingdom", "United Kingdom"],
    ["canada (national)", "Canada"],
    ["multi country", "Multi-country"],
    ["multi-country", "Multi-country"],
    ["global", "Global"]
  ]);

  return map.get(normalizeText(cleaned)) ?? cleaned;
}

function regionNormalized(region, country) {
  const normalizedRegion = formatFacetValue(region);
  if (normalizedRegion) return normalizedRegion;
  if (country === "Global") return "Global";
  if (country === "Multi-country") return "Multi-country";
  return "Other";
}

function missingnessLevel(percentPresent) {
  const percentMissing = 100 - percentPresent;
  if (percentMissing > MISSINGNESS_THRESHOLDS.high) return "High missingness";
  if (percentMissing >= MISSINGNESS_THRESHOLDS.medium) return "Medium missingness";
  return "Low missingness";
}

async function ensureDir(directory) {
  await fs.mkdir(directory, { recursive: true });
}

async function readCsv(file) {
  const text = await fs.readFile(file, "utf8");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

function uniqueSourceLinks(record) {
  const links = [];

  for (const index of [1, 2, 3]) {
    const url = cleanText(record[`source_url_${index}`]);
    if (!url) continue;

    links.push({
      url,
      type: cleanText(record[`source_type_${index}`])
    });
  }

  const seen = new Set();

  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

function mapFeature(project) {
  if (!project.coordinates) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: project.coordinates
    },
    properties: {
      slug: project.slug,
      projectName: project.projectName,
      category: project.category,
      city: project.city,
      country: project.countryNormalized ?? project.country,
      region: project.region,
      organizationType: project.organizationType,
      participationModeGroup: project.participationModeGroup,
      technologyGroup: project.technologyGroup,
      atlasDecision: project.atlasDecision,
      reviewStatus: project.reviewStatus
    }
  };
}

async function copyFileIfExists(source, destination) {
  try {
    await fs.copyFile(source, destination);
  } catch {
    // ignore
  }
}

async function main() {
  await ensureDir(GENERATED_DIR);
  await ensureDir(RELEASES_DIR);
  await ensureDir(RUNTIME_DIR);
  await ensureDir(PUBLIC_DOWNLOADS_DIR);

  const csvRecords = await readCsv(path.join(RAW_DIR, SOURCE_DATASET_FILE));
  const duplicateNormalizedNameCounts = new Map();

  for (const record of csvRecords) {
    const normalized = normalizeName(record.project_name);
    duplicateNormalizedNameCounts.set(normalized, (duplicateNormalizedNameCounts.get(normalized) ?? 0) + 1);
  }

  const projects = csvRecords.map((record, index) => {
    const projectName = cleanText(record.project_name) ?? `record-${index + 1}`;
    const normalizedName = normalizeName(projectName);
    const city = cleanText(record.city);
    const country = cleanText(record.country);
    const countryName = countryNormalized(country);
    const region = regionNormalized(record.region, countryName);
    const latitude = maybeNumber(record.latitude);
    const longitude = maybeNumber(record.longitude);
    const leadOrg = cleanText(record.lead_org);
    const officialUrl = cleanText(record.official_url);
    const sourceLinks = uniqueSourceLinks(record);
    const provenanceUrl = cleanText(record.provenance_url) ?? officialUrl ?? sourceLinks[0]?.url ?? "";
    const projectDocumentationLink = officialUrl ?? sourceLinks[0]?.url ?? (provenanceUrl || null);
    const additionalLinks = unique(
      [officialUrl, ...sourceLinks.map((link) => link.url)]
        .filter(Boolean)
        .filter((url) => url !== provenanceUrl && url !== projectDocumentationLink)
    );
    const category = cleanText(record.category);
    const applicationDomain = cleanText(record.application_domain);
    const technology = cleanText(record.ai_modality);
    const participationMode = cleanText(record.participation_mode);
    const participationTier = formatFacetValue(record.participation_tier);
    const atlasDecision = formatFacetValue(record.atlas_decision);
    const reviewStatus = formatFacetValue(record.review_status);
    const verificationStatus = formatFacetValue(record.verification_status);
    const description = cleanText(record.participatory_evidence) ?? cleanText(record.notes);
    const tags = unique([...parseList(record.theoretical_lenses), ...parseList(record.ai_lifecycle_stages)]);
    const startYear = maybeInteger(record.start_year);
    const documentationFields = [
      ["city", city],
      ["lead organization", leadOrg],
      ["official or provenance link", projectDocumentationLink ?? (provenanceUrl || null)],
      ["ai modality", technology],
      ["application domain", applicationDomain],
      ["participants", cleanText(record.participants)],
      ["participation methods", cleanText(record.participation_methods)],
      ["participatory evidence", cleanText(record.participatory_evidence)],
      ["review status", reviewStatus],
      ["start year", startYear]
    ];
    const presentFields = documentationFields.filter(([, value]) => value !== null && value !== "").map(([label]) => label);
    const missingFields = documentationFields.filter(([, value]) => value === null || value === "").map(([label]) => label);
    const documentationScore = Math.round((presentFields.length / documentationFields.length) * 100);

    return {
      slug: slugify(projectName),
      projectName,
      normalizedName,
      category,
      secondaryCategory: applicationDomain,
      tags,
      city,
      country,
      countryNormalized: countryName,
      region,
      multiCountry: countryName === "Multi-country",
      latitude,
      longitude,
      coordinates: latitude !== null && longitude !== null ? [longitude, latitude] : null,
      leadOrg,
      organizationType: cleanText(record.lead_org_type) ?? "Unknown",
      activityStatus: cleanText(record.status),
      activityStatusGroup: formatFacetValue(record.status) ?? "Unknown",
      technology,
      technologyGroup: technology ?? "Unspecified",
      participationMode,
      participationModeGroup: participationTier ?? "Unspecified",
      participationDocumented: Boolean(cleanText(record.participatory_evidence) || participationMode),
      participationSpecificity: participationMode ? "Specific" : "Unspecified",
      startYear,
      funding: null,
      regionProjectActivity: cleanText(record.scope),
      description,
      provenanceUrl,
      projectDocumentationLink,
      additionalLinks,
      officialUrl,
      sourceLinks,
      provenanceDomain: (() => {
        try {
          return provenanceUrl ? new URL(provenanceUrl).hostname.replace(/^www\./, "") : null;
        } catch {
          return null;
        }
      })(),
      sourceOrigin: SOURCE_ORIGIN,
      sourceFile: SOURCE_DATASET_FILE,
      sourceSheet: null,
      documentationCompleteness: {
        score: documentationScore,
        filled: presentFields.length,
        total: documentationFields.length,
        presentFields,
        missingFields
      },
      dataRights: {
        redactionSupported: true,
        restrictedDisclosureSupported: true
      },
      recordVersion: RELEASE_ID,
      lastUpdated: cleanText(record.last_verified) ?? RELEASE_DATE,
      recordType: cleanText(record.record_type),
      partnerOrgs: cleanText(record.partner_orgs),
      scope: cleanText(record.scope),
      endYear: maybeInteger(record.end_year),
      locationPrecision: formatFacetValue(record.location_precision),
      applicationDomain,
      participants: cleanText(record.participants),
      participationMethods: cleanText(record.participation_methods),
      aiLifecycleStages: cleanText(record.ai_lifecycle_stages),
      participationTier,
      participationStrength: formatFacetValue(record.participation_strength),
      washingRisk: formatFacetValue(record.washing_risk),
      theoreticalLenses: parseList(record.theoretical_lenses),
      verificationStatus,
      participatoryEvidence: cleanText(record.participatory_evidence),
      note: cleanText(record.notes),
      legacyParticipatoryStatus: formatFacetValue(record.legacy_participatory_status),
      participatoryStatus: formatFacetValue(record.participatory_status),
      atlasDecision,
      participatoryConfidence: formatFacetValue(record.participatory_confidence),
      evidenceGrade: cleanText(record.evidence_grade),
      uncertaintyReason: cleanText(record.uncertainty_reason),
      sourceSeed: cleanText(record.source_seed),
      reviewStatus,
      editLog: [
        {
          id: crypto.randomUUID(),
          type: "import",
          date: RELEASE_DATE,
          summary: `Imported into ${RELEASE_ID}`,
          detail:
            duplicateNormalizedNameCounts.get(normalizedName) > 1
              ? "This normalized project name appears more than once in the vetted atlas CSV and was preserved as provided."
              : `Imported from the vetted atlas CSV with atlas decision ${atlasDecision ?? "Not documented"}${reviewStatus ? ` and review status ${reviewStatus}` : ""}.`
        }
      ]
    };
  });

  const normalizedCountries = unique(projects.map((project) => project.countryNormalized).filter(Boolean)).length;
  const fieldCompleteness = [
    ["city", "City or local anchor", (project) => project.city !== null],
    ["leadOrg", "Lead organization", (project) => project.leadOrg !== null],
    ["projectDocumentationLink", "Official or source link", (project) => project.projectDocumentationLink !== null],
    ["technology", "AI modality", (project) => project.technology !== null],
    ["secondaryCategory", "Application domain", (project) => project.secondaryCategory !== null],
    ["participants", "Participants", (project) => project.participants !== null],
    ["participationMethods", "Participation methods", (project) => project.participationMethods !== null],
    ["participatoryEvidence", "Participatory evidence", (project) => project.participatoryEvidence !== null],
    ["reviewStatus", "Review status", (project) => project.reviewStatus !== null],
    ["startYear", "Start year", (project) => project.startYear !== null]
  ].map(([field, label, predicate]) => {
    const present = projects.filter(predicate).length;
    const percent = (present / projects.length) * 100;

    return {
      field,
      label,
      present,
      total: projects.length,
      percent: Number(percent.toFixed(1)),
      missingnessLevel: missingnessLevel(percent)
    };
  });

  const stats = {
    generatedAt: new Date().toISOString(),
    paperReported: {
      totalProjects: projects.length,
      normalizedCountries,
      coreProjects: projects.filter((project) => project.atlasDecision === "Core").length,
      cautiousProjects: projects.filter((project) => project.atlasDecision === "Cautious").length,
      reviewCandidates: projects.filter((project) => project.atlasDecision === "Review Candidate").length,
      readyProjects: projects.filter((project) => project.reviewStatus === "Ready").length
    },
    dataDerived: {
      totalProjects: projects.length,
      normalizedCountries,
      tags: unique(projects.flatMap((project) => project.tags)).length,
      categories: unique(projects.map((project) => project.category).filter(Boolean)).length
    },
    fieldCompleteness,
    regions: countByName(projects.map((project) => project.region)),
    countries: countByName(projects.map((project) => project.countryNormalized ?? project.country)),
    categories: countByName(projects.map((project) => project.category)),
    organizationTypes: countByName(projects.map((project) => project.organizationType)),
    technologyGroups: countByName(projects.map((project) => project.technologyGroup)),
    activityStatusGroups: countByName(projects.map((project) => project.activityStatusGroup)),
    participationModes: countByName(projects.map((project) => project.participationModeGroup)),
    atlasDecisions: countByName(projects.map((project) => project.atlasDecision)),
    reviewStatuses: countByName(projects.map((project) => project.reviewStatus)),
    topTags: countByName(projects.flatMap((project) => project.tags)).slice(0, 20)
  };

  const schema = {
    version: RELEASE_ID,
    generatedAt: new Date().toISOString(),
    minimalParticipationDocumentation: [
      {
        key: "participationMode",
        label: "Participation mode",
        description: "How the source describes participation or public involvement in the project.",
        requiredForContribution: true,
        publicByDefault: true
      },
      {
        key: "participants",
        label: "Participants",
        description: "Who takes part, such as communities, workers, publics, or institutional partners.",
        requiredForContribution: true,
        publicByDefault: true
      },
      {
        key: "participationMethods",
        label: "Participation methods",
        description: "Concrete methods such as workshops, deliberation, data collection, annotation, or auditing.",
        requiredForContribution: true,
        publicByDefault: true
      },
      {
        key: "participatoryEvidence",
        label: "Participatory evidence",
        description: "Short, evidence-backed summary showing why the case belongs in the atlas.",
        requiredForContribution: true,
        publicByDefault: true
      }
    ],
    recordFields: [
      {
        key: "projectName",
        label: "Project name",
        description: "Canonical project title used in the atlas.",
        requiredForContribution: true,
        publicByDefault: true
      },
      {
        key: "provenanceUrl",
        label: "Provenance URL",
        description: "Stable public source used to verify the record.",
        requiredForContribution: true,
        publicByDefault: true
      },
      {
        key: "officialUrl",
        label: "Official URL",
        description: "Primary project, program, or organization page when one exists.",
        requiredForContribution: false,
        publicByDefault: true
      },
      {
        key: "country",
        label: "Country",
        description: "Country or global anchor used for atlas placement.",
        requiredForContribution: true,
        publicByDefault: true
      },
      {
        key: "city",
        label: "City",
        description: "Optional city-level anchor when public materials make it clear.",
        requiredForContribution: false,
        publicByDefault: true
      },
      {
        key: "leadOrg",
        label: "Lead organization",
        description: "Lead organization, lab, coalition, or steward named in the source materials.",
        requiredForContribution: false,
        publicByDefault: true
      },
      {
        key: "category",
        label: "Category",
        description: "Primary atlas category for the project.",
        requiredForContribution: false,
        publicByDefault: true
      },
      {
        key: "applicationDomain",
        label: "Application domain",
        description: "Substantive domain such as healthcare, governance, accessibility, or humanitarian response.",
        requiredForContribution: false,
        publicByDefault: true
      },
      {
        key: "atlasDecision",
        label: "Atlas decision",
        description: "Current atlas placement such as Core, Cautious, or Review Candidate.",
        requiredForContribution: false,
        publicByDefault: true
      },
      {
        key: "reviewStatus",
        label: "Review status",
        description: "Current review state for the record, such as Ready or Manual Review Required.",
        requiredForContribution: false,
        publicByDefault: true
      },
      {
        key: "evidenceGrade",
        label: "Evidence grade",
        description: "High-level quality signal for the available evidence.",
        requiredForContribution: false,
        publicByDefault: true
      }
    ]
  };

  const geojson = {
    type: "FeatureCollection",
    features: projects.map(mapFeature).filter(Boolean)
  };

  const projectsJson = JSON.stringify(projects, null, 2);
  const statsJson = JSON.stringify(stats, null, 2);
  const schemaJson = JSON.stringify(schema, null, 2);
  const geojsonJson = JSON.stringify(geojson, null, 2);

  await fs.writeFile(path.join(GENERATED_DIR, "projects.json"), `${projectsJson}\n`, "utf8");
  await fs.writeFile(path.join(GENERATED_DIR, "stats.json"), `${statsJson}\n`, "utf8");
  await fs.writeFile(path.join(GENERATED_DIR, "schema.json"), `${schemaJson}\n`, "utf8");
  await fs.writeFile(path.join(GENERATED_DIR, "projects.geojson"), `${geojsonJson}\n`, "utf8");

  const releaseDir = path.join(RELEASES_DIR, RELEASE_ID);
  await ensureDir(releaseDir);

  const releaseArtifactsToWrite = [
    ["projects.json", projectsJson],
    ["stats.json", statsJson],
    ["schema.json", schemaJson],
    ["projects.geojson", geojsonJson]
  ];

  for (const [name, content] of releaseArtifactsToWrite) {
    await fs.writeFile(path.join(releaseDir, name), `${content}\n`, "utf8");
  }

  const rawPublicDir = path.join(PUBLIC_DOWNLOADS_DIR, "raw");
  const publicReleaseDir = path.join(PUBLIC_DOWNLOADS_DIR, RELEASE_ID);
  const publicCurrentDir = path.join(PUBLIC_DOWNLOADS_DIR, "current");
  await ensureDir(rawPublicDir);
  await ensureDir(publicReleaseDir);
  await ensureDir(publicCurrentDir);

  await copyFileIfExists(path.join(RAW_DIR, SOURCE_DATASET_FILE), path.join(rawPublicDir, SOURCE_DATASET_FILE));

  for (const [name, content] of releaseArtifactsToWrite) {
    await fs.writeFile(path.join(publicReleaseDir, name), `${content}\n`, "utf8");
    await fs.writeFile(path.join(publicCurrentDir, name), `${content}\n`, "utf8");
  }

  await copyFileIfExists(
    path.join(RAW_DIR, SOURCE_DATASET_FILE),
    path.join(publicReleaseDir, SOURCE_DATASET_FILE)
  );
  await copyFileIfExists(
    path.join(RAW_DIR, SOURCE_DATASET_FILE),
    path.join(publicCurrentDir, SOURCE_DATASET_FILE)
  );

  const checksum = crypto.createHash("sha256").update(projectsJson).digest("hex");

  const artifacts = await Promise.all(
    [
      {
        label: "Processed JSON",
        publicPath: `/downloads/${RELEASE_ID}/projects.json`,
        filePath: path.join(publicReleaseDir, "projects.json")
      },
      {
        label: "Processed GeoJSON",
        publicPath: `/downloads/${RELEASE_ID}/projects.geojson`,
        filePath: path.join(publicReleaseDir, "projects.geojson")
      },
      {
        label: "Dataset stats",
        publicPath: `/downloads/${RELEASE_ID}/stats.json`,
        filePath: path.join(publicReleaseDir, "stats.json")
      },
      {
        label: "Schema",
        publicPath: `/downloads/${RELEASE_ID}/schema.json`,
        filePath: path.join(publicReleaseDir, "schema.json")
      },
      {
        label: "Vetted source CSV",
        publicPath: `/downloads/${RELEASE_ID}/${SOURCE_DATASET_FILE}`,
        filePath: path.join(publicReleaseDir, SOURCE_DATASET_FILE)
      }
    ].map(async (artifact) => {
      const stat = await fs.stat(artifact.filePath);
      return {
        label: artifact.label,
        path: artifact.publicPath,
        bytes: stat.size
      };
    })
  );

  const releases = [
    {
      id: RELEASE_ID,
      label: `${RELEASE_ID} vetted snapshot`,
      date: RELEASE_DATE,
      recordCount: projects.length,
      normalizedCountries,
      checksum,
      sourceFiles: [SOURCE_DATASET_FILE],
      citation: `Participatory AI Atlas. ${RELEASE_ID} vetted snapshot generated from ${SOURCE_DATASET_FILE} on ${RELEASE_DATE}.`,
      notes: [
        "Single-source import from the vetted atlas CSV.",
        "Legacy workbook merges and previous canonical CSVs are no longer part of the build pipeline.",
        "Form moderation is handled outside the release dataset until reviewed and merged."
      ],
      artifacts
    }
  ];

  const releasesJson = JSON.stringify(releases, null, 2);
  await fs.writeFile(path.join(GENERATED_DIR, "releases.json"), `${releasesJson}\n`, "utf8");
  await fs.writeFile(path.join(releaseDir, "manifest.json"), `${releasesJson}\n`, "utf8");
  await fs.writeFile(path.join(publicReleaseDir, "manifest.json"), `${releasesJson}\n`, "utf8");
  await fs.writeFile(path.join(publicCurrentDir, "manifest.json"), `${releasesJson}\n`, "utf8");

  console.log(`Built ${projects.length} projects into ${RELEASE_ID}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
