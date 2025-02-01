"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

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
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <>
              {user.email?.endsWith('@admin.com') && (
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
              {user && (
                <Link href="/profile" className="flex items-center gap-2">
                  {user.user_metadata.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      className="w-8 h-8 rounded-full"
                      alt="Profile"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span>{user.user_metadata.username || user.email}</span>
                </Link>
              )}
            </>
          ) : (
            <Link href="/auth">
              <Button>
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}