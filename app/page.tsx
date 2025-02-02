"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Timer, 
  DollarSign, 
  Trash2, 
  Upload,
  Plus,
  FolderPlus,
  X,
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Todo {
  id: string;
  task: string;
  deadline: Date;
  stake: number;
  completed: boolean;
  evidence: string;
  group_id: number | null;
  verified: boolean;
  verificationpending: boolean;
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

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

      // Fetch todos (updated to get all todos)
      const { data: todosData } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('deleted', false);
      
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
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

      // Update todo record
      const { error: updateError } = await supabase
        .from('todos')
        .update({
          evidence: publicUrl,
          verificationpending: true
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, evidence: publicUrl } : todo
      ));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('File upload failed. Please try again.');
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

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    const { error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, ...updates } : todo
      ));
    }
  };

  const handleSubmitEvidence = async (id: string) => {
    await updateTodo(id, { 
      verificationpending: true,
      completed: true 
    });
    setSelectedTaskId(null);
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

  // Updated task sections organization
  const taskSections = {
    currentTasks: filteredTodos.filter(todo => 
      !todo.completed && !isPast(new Date(todo.deadline))
    ),
    pastDue: filteredTodos.filter(todo => 
      !todo.completed && isPast(new Date(todo.deadline))
    ),
    awaitingEvidence: filteredTodos.filter(todo => 
      todo.completed && !todo.evidence
    ),
    inReview: filteredTodos.filter(todo => 
      todo.completed && todo.evidence && todo.verificationpending && !todo.verified
    ),
    approved: filteredTodos.filter(todo => todo.verified),
    rejected: filteredTodos.filter(todo => 
      todo.completed && 
      todo.evidence && 
      todo.verificationpending === false &&
      !todo.verified
    )
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto bg-background text-foreground">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            ProveIt: Put your money where your mouth is
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-secondary text-foreground">
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
                <PopoverContent className="w-[400px] p-4 text-foreground bg-background">
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
                <div className="space-y-8">
                  {Object.entries(taskSections).map(([sectionKey, sectionTasks]) => (
                    <div key={sectionKey} className="border rounded-lg p-4 mb-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer" 
                        onClick={() => setCollapsedSections(prev => ({
                          ...prev,
                          [sectionKey]: !prev[sectionKey]
                        }))}
                      >
                        <h2 className="text-xl font-bold capitalize">
                          {sectionKey.replace(/([A-Z])/g, ' $1')}
                          <span className="text-muted-foreground ml-2">
                            ({sectionTasks.length})
                          </span>
                        </h2>
                        <ChevronDown className={`w-5 h-5 transition-transform ${
                          collapsedSections[sectionKey] ? 'rotate-180' : ''
                        }`} />
                      </div>
                      
                      {!collapsedSections[sectionKey] && (
                        <div className="mt-4">
                          {sectionTasks.length === 0 ? (
                            <div className="text-center p-6 text-muted-foreground">
                              {sectionKey === 'approved' ? "No approved tasks yet - keep going! 🌟" : 
                              sectionKey === 'pastDue' ? "All tasks up to date! 🎉" : 
                              sectionKey === 'currentTasks' ? "No current tasks" :
                              "Nothing here yet :)"}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {sectionTasks.map((todo) => (
                                <div key={todo.id} className="p-4 border rounded-md">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h3 className={cn("text-xl font-semibold", 
                                        todo.completed && "line-through text-muted-foreground"
                                      )}>
                                        {todo.task}
                                      </h3>
                                      <div className="flex gap-4 mt-2">
                                        {groups.find(g => g.id === todo.group_id)?.name && (
                                          <Badge variant="outline" className="text-muted-foreground">
                                            {groups.find(g => g.id === todo.group_id)?.name}
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
                                      {sectionKey === 'currentTasks' && (
                                        <>
                                          <Button 
                                            onClick={() => {
                                              updateTodo(todo.id, { completed: true });
                                              setSelectedTaskId(todo.id);
                                            }}
                                            className="bg-background text-foreground hover:bg-primary/90 outline-dashed"
                                          >
                                            Mark Complete
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            size="icon"
                                            className={cn({'hidden': isPast(new Date(todo.deadline))})}
                                            onClick={() => deleteTodo(todo.id)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}

                                      {sectionKey === 'awaitingEvidence' && (
                                        <div className="flex items-center gap-2">
                                          <label className="cursor-pointer">
                                            <Input
                                              type="file"
                                              className="hidden"
                                              onChange={(e) => handleFileUpload(todo.id, e.target.files?.[0]!)}
                                            />
                                            <Button variant="outline" size="icon" asChild>
                                              <span>
                                                <Upload className="w-4 h-4" />
                                              </span>
                                            </Button>
                                          </label>
                                          <Button 
                                            onClick={() => handleSubmitEvidence(todo.id)}
                                            disabled={!todo.evidence}
                                          >
                                            Submit
                                          </Button>
                                        </div>
                                      )}

                                      {(sectionKey === 'approved' || sectionKey === 'inReview' || sectionKey === 'rejected') && (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="link" className="hover:cursor-pointer text-foreground bg-background">
                                              View Evidence
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-[90vw] h-[90vh]">
                                            <img 
                                              src={todo.evidence} 
                                              alt="Evidence" 
                                              className="object-contain w-full h-full"
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      )}

                                      {sectionKey === 'pastDue' && (
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className={cn({'hidden': isPast(new Date(todo.deadline))})}
                                          onClick={() => deleteTodo(todo.id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {groups.map(group => (
                <TabsContent key={group.id} value={group.id.toString()} className="space-y-4 mt-4">
                  <div className="space-y-8">
                    {Object.entries(taskSections).map(([sectionKey, sectionTasks]) => {
                      const groupTasks = sectionTasks.filter(todo => todo.group_id === group.id);
                      
                      return (
                        <div key={sectionKey} className="border rounded-lg p-4 mb-4">
                          <div 
                            className="flex items-center justify-between cursor-pointer" 
                            onClick={() => setCollapsedSections(prev => ({
                              ...prev,
                              [sectionKey]: !prev[sectionKey]
                            }))}
                          >
                            <h2 className="text-xl font-bold capitalize">
                              {sectionKey.replace(/([A-Z])/g, ' $1')}
                              <span className="text-muted-foreground ml-2">
                                ({groupTasks.length})
                              </span>
                            </h2>
                            <ChevronDown className={`w-5 h-5 transition-transform ${
                              collapsedSections[sectionKey] ? 'rotate-180' : ''
                            }`} />
                          </div>
                          
                          {!collapsedSections[sectionKey] && (
                            <div className="mt-4">
                              {groupTasks.length === 0 ? (
                                <div className="text-center p-6 text-muted-foreground">
                                  {sectionKey === 'approved' ? "No approved tasks yet - keep going! 🌟" : 
                                   sectionKey === 'pastDue' ? "All tasks up to date! 🎉" : 
                                   sectionKey === 'currentTasks' ? "No current tasks in this group" :
                                   "Nothing here yet :)"}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {groupTasks.map((todo) => (
                                    <div key={todo.id} className="p-4 border rounded-md">
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
                                          {sectionKey === 'currentTasks' && (
                                            <>
                                              <Button 
                                                onClick={() => {
                                                  updateTodo(todo.id, { completed: true });
                                                  setSelectedTaskId(todo.id);
                                                }}
                                                className="bg-background text-foreground hover:bg-primary/90"
                                              >
                                                Mark Complete
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                size="icon"
                                                className={cn({'hidden': isPast(new Date(todo.deadline))})}
                                                onClick={() => deleteTodo(todo.id)}
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </>
                                          )}

                                          {sectionKey === 'awaitingEvidence' && (
                                            <div className="flex items-center gap-2">
                                              <label className="cursor-pointer">
                                                <Input
                                                  type="file"
                                                  className="hidden"
                                                  onChange={(e) => handleFileUpload(todo.id, e.target.files?.[0]!)}
                                                />
                                                <Button variant="outline" size="icon" asChild>
                                                  <span>
                                                    <Upload className="w-4 h-4" />
                                                  </span>
                                                </Button>
                                              </label>
                                              <Button 
                                                onClick={() => handleSubmitEvidence(todo.id)}
                                                disabled={!todo.evidence}
                                              >
                                                Submit
                                              </Button>
                                            </div>
                                          )}

                                          {(sectionKey === 'approved' || sectionKey === 'inReview' || sectionKey === 'rejected') && (
                                            <Dialog>
                                              <DialogTrigger asChild>
                                                <Button variant="link" className="hover:cursor-pointer">
                                                  View Evidence
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent className="max-w-[90vw] h-[90vh]">
                                                <img 
                                                  src={todo.evidence} 
                                                  alt="Evidence" 
                                                  className="object-contain w-full h-full"
                                                />
                                              </DialogContent>
                                            </Dialog>
                                          )}

                                          {sectionKey === 'pastDue' && (
                                            <Button
                                              variant="destructive"
                                              size="icon"
                                              className={cn({'hidden': isPast(new Date(todo.deadline))})}
                                              onClick={() => deleteTodo(todo.id)}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      <Popover open={openAddTask} onOpenChange={setOpenAddTask}>
        <PopoverTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
            size="icon"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-4 text-foreground bg-background">
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
              <PopoverContent className="w-auto p-0 bg-background text-foreground">
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="hover:cursor-pointer">
                    View Evidence
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] h-[90vh]">
                  <img 
                    src={todo.evidence} 
                    alt="Evidence" 
                    className="object-contain w-full h-full"
                  />
                </DialogContent>
              </Dialog>
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
            className={cn({'hidden': isPast(new Date(todo.deadline))})}
            onClick={() => onDelete(todo.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}