"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "review" | "completed";
  dueDate: Date;
  priority: "low" | "medium" | "high";
  assignedTo?: {
    name: string;
    avatar?: string;
  };
}

interface TaskSummaryProps {
  tasks: Task[];
  viewAllLink: string;
  title: string;
  emptyMessage?: string;
  limit?: number;
  loading?: boolean;
}

export function TaskSummary({ 
  tasks, 
  viewAllLink, 
  title, 
  emptyMessage = "No tasks to display",
  limit = 3,
  loading = false
}: TaskSummaryProps) {
  // Calculate completion percentage
  const tasksCompleted = tasks.filter(t => t.status === "completed").length;
  const completionPercentage = tasks.length ? Math.round((tasksCompleted / tasks.length) * 100) : 0;

  // Filter for display limiting to the specified limit
  const displayTasks = tasks.slice(0, limit);
  
  // Status badge styles
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">In Progress</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">Review</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">Pending</Badge>;
    }
  };
  
  // Priority indicator
  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />;
      case 'medium':
        return <Badge variant="default" className="bg-amber-500 h-2 w-2 rounded-full p-0" />;
      default:
        return <Badge variant="secondary" className="bg-green-500 h-2 w-2 rounded-full p-0" />;
    }
  };
  
  if (loading) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center mb-2">
          <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
          <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 border rounded-md">
              <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{title}</h3>
        <div className="text-sm text-muted-foreground">
          {tasksCompleted} of {tasks.length} complete
        </div>
      </div>
      
      <div className="mb-4">
        <Progress value={completionPercentage} className="h-2" />
      </div>
      
      {displayTasks.length > 0 ? (
        <div className="space-y-2">
          {displayTasks.map((task) => (
            <div 
              key={task.id}
              className="flex items-center justify-between p-2 border rounded-md group hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {getPriorityIcon(task.priority)}
                <span className="text-sm">{task.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(task.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-center text-muted-foreground py-3">
          {emptyMessage}
        </p>
      )}
      
      {tasks.length > 0 && (
        <div className="mt-4">
          <Link href={viewAllLink}>
            <Button variant="ghost" size="sm" className="gap-1 w-full justify-center">
              View All
              <Icons.arrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}