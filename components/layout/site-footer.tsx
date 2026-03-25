import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-4 px-4 py-8 text-sm text-subtle sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="font-medium text-foreground">Participatory AI Atlas</p>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/contribute" className="text-accent transition hover:text-foreground">
            Contribute
          </Link>
          <p>Code: MIT. Dataset attribution follows the bundled source notes.</p>
        </div>
      </div>
    </footer>
  );
}
