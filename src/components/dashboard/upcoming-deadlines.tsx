import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";

interface UpcomingDeadlinesProps {
  deadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
    isOverdue: boolean;
  }>;
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  // Get priority display style
  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // If it's today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    // If it's tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    
    // Otherwise, return the date
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    }
  };

  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
        <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deadlines.map((deadline) => (
        <Link href={`/dashboard/junior/tasks/${deadline.id}`} key={deadline.id}>
          <Card className={`p-3 hover:bg-muted/50 transition-colors ${
            deadline.isOverdue ? "border-red-300 dark:border-red-800" : ""
          }`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className={`font-medium ${deadline.isOverdue ? "text-red-600 dark:text-red-400" : ""}`}>
                  {deadline.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(deadline.dueDate)}
                </p>
              </div>
              <Badge className={getPriorityStyle(deadline.priority)}>
                {deadline.priority}
              </Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-xs ${
                deadline.isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
              }`}>
                {getDaysRemaining(deadline.dueDate)}
              </span>
              {deadline.isOverdue && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}