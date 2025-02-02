"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useUser();
  const [error, setError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      router.push('/');
    }
    setLoading(false);
  }, [user, router]);

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (user) {
    return null;
  }
  //!
  const validatePassword = (password: string) => {
    const regex = /^(?=.*\d)(?=.*[a-zA-Z]).{6,}$/;
    return regex.test(password);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    //!
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords must match");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters long and contain at least one number and one letter");
      return;
    }
    //!
    
    try {
      if (isSignUp) {
        await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }
      router.push('/');
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 bg-background text-foreground">
      <Card className="max-w-md mx-auto bg-background text-foreground">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? "Create Account" : "Sign In"}
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-background text-foreground">
          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {isSignUp && (
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}
            <Button type="submit" className="w-full">
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Need an account? Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}