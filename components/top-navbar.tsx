"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNavbar() {
  return (
    <nav className="flex h-16 items-center px-4 border-b w-full">
      <div className="flex-1">
        <Link href="/" className="font-semibold">
          Your Logo
        </Link>
      </div>
      
      <div className="flex gap-4">
        <Button asChild variant="ghost">
          <Link href="/auth">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Link>
        </Button>
      </div>
    </nav>
  )
} 