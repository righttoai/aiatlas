export type RightToAiProject = {
  id: "atlas" | "ai-pluralism-index";
  name: string;
  label: string;
  href: string;
  description: string;
  external: boolean;
};

export const RIGHT_TO_AI = {
  name: "The Right to AI",
  label: "Nonprofit initiative",
  href: "https://therighttoai.com/",
  description: "The nonprofit home for public-interest AI participation."
} as const;

export const RIGHT_TO_AI_PROJECTS: RightToAiProject[] = [
  {
    id: "atlas",
    name: "Participatory AI Atlas",
    label: "Evidence project",
    href: "/atlas",
    description: "A living map of participatory AI in practice.",
    external: false
  },
  {
    id: "ai-pluralism-index",
    name: "AI Pluralism Index",
    label: "Accountability project",
    href: "https://aipluralism.wiki/",
    description: "A public index for pluralism, accountability, and participation in AI.",
    external: true
  }
];
