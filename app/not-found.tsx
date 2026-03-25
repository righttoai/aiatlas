import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell py-20">
      <Card className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl text-foreground">Record not found</h1>
        <p className="mt-4 text-muted">Try the atlas explorer or return to the homepage.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonStyles({ variant: "primary" })}>
            Home
          </Link>
          <Link href="/atlas" className={buttonStyles({ variant: "secondary" })}>
            Open atlas
          </Link>
        </div>
      </Card>
    </div>
  );
}
