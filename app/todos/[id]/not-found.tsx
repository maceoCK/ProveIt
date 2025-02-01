import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Todo Not Found</h1>
          <p className="text-muted-foreground">
            The requested todo could not be found.
          </p>
        </div>
        <Button asChild>
          <Link href="/todos">
            View All Todos
          </Link>
        </Button>
      </main>
    </div>
  );
} 