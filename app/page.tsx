"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle2, Timer, DollarSign, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

interface Todo {
  id: string;
  task: string;
  deadline: Date;
  stake: number;
  completed: boolean;
  evidence: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState("");
  const [date, setDate] = useState<Date>();
  const [stake, setStake] = useState("");
  const [selectedTodo, setSelectedTodo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchTodos = async () => {
      const { data } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('deleted', false)
        .eq('completed', false);
      
      if (data) {
        setTodos(data);
      }
    };

    fetchTodos();
  }, [supabase, user]);

  const addTodo = async () => {
    if (!newTask || !date || !stake || !user) return;

    const todo = {
      user_id: user.id,
      task: newTask,
      deadline: date.toISOString(),
      stake: parseFloat(stake),
      completed: false,
    };

    const { data, error } = await supabase
      .from('todos')
      .insert(todo)
      .select()
      .single();

    if (data) {
      setTodos([...todos, data]);
      setNewTask("");
      setDate(undefined);
      setStake("");
    }
  };

  const handleFileUpload = async (id: string, file: File) => {
    if (!file || !user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

      // Update todo with evidence URL
      const { error: updateError } = await supabase
        .from('todos')
        .update({
          completed: true,
          evidence: publicUrl
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTodos(todos.map(todo =>
        todo.id === id
          ? { ...todo, completed: true, evidence: publicUrl }
          : todo
      ));
      setSelectedTodo(null);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .update({ 
        deleted: true,
        deleted_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (!error) {
      setTodos(todos.filter((todo) => todo.id !== id));
    }
  };

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth');
    }
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Todo List with Stakes 💰
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="What do you need to do?"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a deadline</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="number"
                placeholder="Stake amount ($)"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-[150px]"
              />
              <Button onClick={addTodo}>Add Task</Button>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Search todos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4 mt-8">
              {todos
                .filter(todo => 
                  todo.task.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((todo) => (
                  <Card key={todo.id} className="p-4" onClick={() => router.push(`/todos/${todo.id}`)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={cn("text-xl font-semibold", 
                          todo.completed && "line-through text-muted-foreground"
                        )}>
                          {todo.task}
                        </h3>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center text-muted-foreground">
                            <Timer className="w-4 h-4 mr-1" />
                            {format(new Date(todo.deadline), "PPP")}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {todo.stake.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {todo.completed ? (
                          <>
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Completed
                            </Badge>
                            <a
                              href={todo.evidence}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              View Evidence
                            </a>
                          </>
                        ) : (
                          <>
                            {selectedTodo === todo.id ? (
                              <div className="flex gap-2">
                                <Input
                                  type="file"
                                  accept="image/*,video/*,.pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload(todo.id, file);
                                    }
                                  }}
                                  className="w-[200px]"
                                />
                                {uploading && <span>Uploading...</span>}
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => setSelectedTodo(todo.id)}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Evidence
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteTodo(todo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}