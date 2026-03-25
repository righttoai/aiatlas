# Software requirements extracted from the attached materials

This file maps only the software-relevant requirements from the submission materials into implementation work.

## Core atlas requirements from the paper

Implemented:

- versioned repository records with provenance
- interactive atlas map
- filtering by geography, topic tags, organization orientation, and participation mechanism fields where present
- drill-down project pages
- transparency about what is known, missing, and contested
- approximate geographic anchors rather than precise operational locations
- documentation completeness profile
- open submissions with review rather than automatic publication
- change logs and archived releases

## Review and rebuttal items implemented because they affect the software

Implemented:

- accessible atlas visuals using the provided high-contrast brand system
- explicit scope boundary between participation for AI and AI for participation
- issue threads linked to records
- annotation channel distinct from record edits
- release archive for citation
- redaction / restricted-disclosure requests
- moderated intake workflow
- schema feedback channel for governance changes
- missingness thresholds surfaced in methodology
- bias and coverage notes on the site, including language and discovery bias
- minimal viable participation documentation fields used in the contribution form

Not implemented because they are paper-only or citation-only revisions:

- related work expansion
- paper framing changes about novelty
- citation additions
- figure replacement requests specific to manuscript production

## Brand requirements applied

- background / black: `#000000`
- accent / blue: `#00BFFF`
- foreground / white: `#FFFFFF`
- primary typeface: Space Grotesk via `next/font/google`
- Tailwind `font-sans` maps to `var(--font-space-grotesk)`

## Corpus counts preserved from the paper

- 243 projects total
- 35 normalized country labels
- 205 records from the public-interest AI dataset
- 38 audited extension cases
- 12 records with a specific participation mechanism documented
