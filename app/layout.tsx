"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { ThemeProvider } from "next-themes";
import { Navbar } from '@/components/navbar';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider, useUser } from '@supabase/auth-helpers-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

// Initialize the Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const user = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <html lang="en">
        <head />
        <body className={inter.className}>
          <div className="min-h-screen bg-background" />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <SessionContextProvider supabaseClient={supabase}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex min-h-screen">
              <Sheet>
                <SheetTrigger className="md:hidden p-4">
                  <Menu className="h-6 w-6" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px]">
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-4">ProveIt</h2>
                    <nav className="space-y-2">
                      <Link href="/" className="block hover:bg-accent p-2 rounded">Home</Link>
                      <Link href="/profile" className="block hover:bg-accent p-2 rounded">Profile</Link>
                      {user?.email == 'maceo.ck@gmail.com' && (
                        <Link href="/admin" className="block hover:bg-accent p-2 rounded">Admin</Link>
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex-1">
                <Navbar />
                <main className="container mx-auto p-4">
                  {children}
                </main>
              </div>
            </div>
          </ThemeProvider>
        </SessionContextProvider>
      </body>
    </html>
  );
}