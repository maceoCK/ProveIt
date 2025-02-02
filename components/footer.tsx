"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">ProveIt</h3>
            <p className="text-sm text-muted-foreground">
              Accountability through charitable commitments
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button variant="link" asChild>
              <Link href="/about" className="text-muted-foreground">
                About Us
              </Link>
            </Button>
            <Button variant="link" asChild>
              <a 
                href="https://github.com/maceoCK/ProveIt" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground"
              >
                GitHub
              </a>
            </Button>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500" /> for accountability
          </div>
          <p className="mt-2">© {new Date().getFullYear()} ProveIt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 