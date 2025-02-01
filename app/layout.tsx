"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "next-themes";
import { Navbar } from '@/components/navbar';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

const inter = Inter({ subsets: ['latin'] });

// Initialize the Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-background" />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionContextProvider supabaseClient={supabase}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Navbar />
            {children}
          </ThemeProvider>
        </SessionContextProvider>
      </body>
    </html>
  );
}