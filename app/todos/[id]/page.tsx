import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, Timer, DollarSign } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getTodo(id: string) {
  const { data, error } = await supabase
    .from('todos')
    .select()
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  return data;
}

export default async function TodoPage({ params }: { params: { id: string } }) {
  const todo = await getTodo(params.id);
  
  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{todo.task}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            <span>Deadline: {format(new Date(todo.deadline), "PPP")}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <span>Stake: ${todo.stake}</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Status: </span>
            <Badge variant={todo.completed ? "secondary" : "default"}>
              {todo.completed ? "Completed" : "In Progress"}
            </Badge>
          </div>

          {todo.evidence && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Evidence:</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto">
                    <img 
                      src={todo.evidence} 
                      alt="Task evidence"
                      className="max-w-full h-40 rounded-lg cursor-pointer"
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] h-[90vh]">
                  <img 
                    src={todo.evidence} 
                    alt="Evidence Full View" 
                    className="object-contain w-full h-full"
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}