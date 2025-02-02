"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Timer, 
  DollarSign, 
  Trash2, 
  Upload,
  Plus,
  FolderPlus,
  X
} from "lucide-react";
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
  group_id: number | null;
}

interface TaskGroup {
  id: number;
  name: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [newTask, setNewTask] = useState("");
  const [date, setDate] = useState<Date>();
  const [stake, setStake] = useState("");
  const [selectedTodo, setSelectedTodo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [openAddGroup, setOpenAddGroup] = useState(false);
  const [openAddTask, setOpenAddTask] = useState(false);
  
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch task groups
      const { data: groupsData } = await supabase
        .from('task_groups')
        .select('*')
        .eq('user_id', user.id)
        .eq('deleted', false);

      if (groupsData) {
        setGroups(groupsData);
      }

      // Fetch todos
      const { data: todosData } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('deleted', false)
        .eq('completed', false);
      
      if (todosData) {
        setTodos(todosData);
      }
    };

    fetchData();
  }, [supabase, user]);

  const addGroup = async () => {
    if (!newGroupName || !user) return;

    const { data, error } = await supabase
      .from('task_groups')
      .insert({
        name: newGroupName,
        user_id: user.id
      })
      .select()
      .single();

    if (data) {
      setGroups([...groups, data]);
      setNewGroupName("");
      setOpenAddGroup(false);
    }
    if (error) {
      console.error('Error adding group:', error);
    }
  };

  const addTodo = async () => {
    if (!newTask || !date || !stake || !user) return;

    const todo = {
      user_id: user.id,
      task: newTask,
      deadline: date.toISOString(),
      stake: parseFloat(stake),
      completed: false,
      group_id: selectedGroup
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
      setOpenAddTask(false);
    }
  };

  const handleFileUpload = async (id: string, file: File) => {
    if (!file || !user) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

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

  const deleteGroup = async (id: number) => {
    const { error } = await supabase
      .from('task_groups')
      .update({ 
        deleted: true,
        deleted_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (!error) {
      setGroups(groups.filter((group) => group.id !== id));
      if (selectedGroup === id) {
        setSelectedGroup(null);
      }
    }
    else {
      console.error('Error deleting group:', error);
    }
  };

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth');
    }
    return null;
  }

  const filteredTodos = todos.filter(todo => 
    todo.task.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedGroup === null || todo.group_id === selectedGroup)
  );

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Todo List with Stakes 💰
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger 
                  value="all" 
                  onClick={() => setSelectedGroup(null)}
                >
                  All Tasks
                </TabsTrigger>
                {groups.map(group => (
                  <TabsTrigger 
                    key={group.id} 
                    value={group.id.toString()} 
                    className="group relative"
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    {group.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 absolute -right-1 -top-1 hidden group-hover:flex p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(group.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TabsTrigger>
                ))}
              </TabsList>
              <Popover open={openAddGroup} onOpenChange={setOpenAddGroup}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Group
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <Button onClick={addGroup}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Group
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <Input
                  placeholder="Search todos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <TabsContent value="all" className="space-y-4 mt-4">
                {filteredTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onDelete={deleteTodo}
                    onUpload={handleFileUpload}
                    selectedTodo={selectedTodo}
                    setSelectedTodo={setSelectedTodo}
                    uploading={uploading}
                    router={router}
                    groups={groups}
                  />
                ))}
              </TabsContent>

              {groups.map(group => (
                <TabsContent key={group.id} value={group.id.toString()} className="space-y-4 mt-4">
                  {filteredTodos
                    .filter(todo => todo.group_id === group.id)
                    .map((todo) => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onDelete={deleteTodo}
                        onUpload={handleFileUpload}
                        selectedTodo={selectedTodo}
                        setSelectedTodo={setSelectedTodo}
                        uploading={uploading}
                        router={router}
                        groups={groups}
                      />
                    ))}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      <Popover open={openAddTask} onOpenChange={setOpenAddTask}>
        <PopoverTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg"
            size="icon"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-4">
          <div className="space-y-4">
            <Input
              placeholder="What do you need to do?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
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
            />
            <Button onClick={addTodo} className="w-full">
              Add Task
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface TodoCardProps {
  todo: Todo;
  onDelete: (id: string) => void;
  onUpload: (id: string, file: File) => void;
  selectedTodo: string | null;
  setSelectedTodo: (id: string | null) => void;
  uploading: boolean;
  router: any;
  groups: TaskGroup[];
}

function TodoCard({
  todo,
  onDelete,
  onUpload,
  selectedTodo,
  setSelectedTodo,
  uploading,
  router,
  groups
}: TodoCardProps) {
  const groupName = groups.find(g => g.id === todo.group_id)?.name;

  return (
    <Card key={todo.id} className="p-4" onClick={() => router.push(`/todos/${todo.id}`)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={cn("text-xl font-semibold", 
            todo.completed && "line-through text-muted-foreground"
          )}>
            {todo.task}
          </h3>
          <div className="flex gap-4 mt-2">
            {groupName && (
              <Badge variant="outline" className="text-muted-foreground">
                {groupName}
              </Badge>
            )}
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
                        onUpload(todo.id, file);
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
            onClick={() => onDelete(todo.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}