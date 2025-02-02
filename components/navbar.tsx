"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Sun, User, Info } from "lucide-react";
import Link from "next/link";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import UserMenu from "@/components/UserMenu";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const supabase = useSupabaseClient();
  const user = useUser();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };


  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          ProveIt
        </Link>


        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="mr-4"
          >
          </Button>

          {user ? (
            <>
              {user.email == 'maceo.ck@gmail.com' && (
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              <UserMenu />
            </>
          ) : (
            <Link href="/auth">
              <Button>
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </Link>
          )}

          <Link href="/about">
            <Button variant="ghost">
              <Info className="h-5 w-5 mr-2" />
              About
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}