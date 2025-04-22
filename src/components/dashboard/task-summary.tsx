"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  // Remove the assignedTo property
  // assignedTo?: { name: string; } | null;
  
  // Add the assignees array property
  assignees?: Array<{ 
    user: { 
      id: string;
      name: string;
    } 
  }>;
}

interface TaskSummaryProps {
  title: string;
  description?: string;
  tasks: Task[];
  limit?: number;
  showAssignee?: boolean;
  onTaskClick?: (taskId: string) => void;
}

export function TaskSummary({
  title,
  description,
  tasks,
  limit = 5,
  showAssignee = false,
  onTaskClick,
}: TaskSummaryProps) {
  const displayTasks = tasks.slice(0, limit);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-500";
      case "in_progress": return "bg-blue-500";
      case "review": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {displayTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No tasks to display
          </div>
        ) : (
          <div className="space-y-4">
            {displayTasks.map((task) => (
              <div 
                key={task.id}
                className={`p-4 border rounded-lg ${
                  onTaskClick ? "cursor-pointer hover:bg-muted" : ""
                }`}
                onClick={() => onTaskClick && onTaskClick(task.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="font-medium">{task.title}</div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    {task.dueDate 
                      ? `Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`
                      : "No due date"}
                  </div>
                  {showAssignee && task.assignees && task.assignees.length > 0 && (
                    <div>Assigned to: {task.assignees.map(a => a.user?.name || 'Unassigned').join(', ')}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {tasks.length > limit && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            + {tasks.length - limit} more tasks not shown
          </div>
        )}
      </CardContent>
    </Card>
  );
}