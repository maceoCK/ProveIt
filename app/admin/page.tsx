"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from "lucide-react";

interface Todo {
  id: string;
  task: string;
  deadline: Date;
  stake: number;
  evidence: string;
  user_id: string;
  verified: boolean;
}

export default function AdminPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('completed', true)
        .eq('verified', false);
      
      if (data) {
        setTodos(data);
      }
    };

    if (user.email?.endsWith('@admin.com')) {
      fetchTodos();
    } else {
      router.push('/');
    }
  }, [supabase, user, router]);

  const handleVerification = async (todoId: string, verified: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ verified })
      .eq('id', todoId);

    if (!error) {
      setTodos(todos.filter(todo => todo.id !== todoId));
    }
  };

  if (!user?.email?.endsWith('@admin.com')) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Evidence Verification Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todos.map((todo) => (
              <Card key={todo.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{todo.task}</h3>
                    <p className="text-muted-foreground">
                      Stake: ${todo.stake.toFixed(2)}
                    </p>
                    <a
                      href={todo.evidence}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View Evidence
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-green-500"
                      onClick={() => handleVerification(todo.id, true)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500"
                      onClick={() => handleVerification(todo.id, false)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {todos.length === 0 && (
              <p className="text-center text-muted-foreground">
                No pending evidence to verify
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}