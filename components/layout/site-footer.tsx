import Link from "next/link";
import { RIGHT_TO_AI, RIGHT_TO_AI_PROJECTS } from "@/lib/initiatives";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-5 px-4 py-8 text-sm text-subtle sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div>
          <p className="font-medium text-foreground">Participatory AI Atlas</p>
          <p className="mt-2 max-w-xl">
            A Right to AI project, alongside the AI Pluralism Index.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:justify-end">
          <Link href="/contribute" className="text-accent transition hover:text-foreground">
            Contribute
          </Link>
          <a
            href={RIGHT_TO_AI.href}
            target="_blank"
            rel="noreferrer"
            className="text-accent transition hover:text-foreground"
          >
            {RIGHT_TO_AI.name}
          </a>
          {RIGHT_TO_AI_PROJECTS.filter((project) => project.external).map((project) => (
            <a
              key={project.id}
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="text-accent transition hover:text-foreground"
            >
              {project.name}
            </a>
          ))}
          <p>Code: MIT. Dataset attribution follows the bundled source notes.</p>
        </div>
      </div>
    </footer>
  );
}
