import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div className="space-y-2 text-center">
          <h1 className="text-9xl font-bold tracking-tighter text-primary">404</h1>
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            Return Home
          </Link>
        </Button>
      </main>
    </div>
  );
} 