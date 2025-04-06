import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, AlertCircle } from "lucide-react";

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  isOverdue: boolean;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  // Sort by date (closest first) and overdue status
  const sortedDeadlines = [...deadlines].sort((a, b) => {
    // First prioritize overdue tasks
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    
    // Then sort by date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  
  // Get priority class
  const getPriorityClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-amber-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Calendar className="h-12 w-12 text-muted-foreground opacity-20 mb-2" />
        <p className="text-muted-foreground">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDeadlines.map((deadline) => (
        <div 
          key={deadline.id} 
          className={`p-3 rounded-md border flex items-center justify-between ${
            deadline.isOverdue ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30" : ""
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {deadline.isOverdue && (
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <p className={`font-medium truncate ${deadline.isOverdue ? "text-red-700 dark:text-red-400" : ""}`}>
                {deadline.title}
              </p>
            </div>
            <div className="flex items-center mt-1">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
              <p className={`text-xs ${deadline.isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                {format(new Date(deadline.dueDate), "MMM d, yyyy")}
                {deadline.isOverdue && " (Overdue)"}
              </p>
            </div>
          </div>
          <div className="ml-2 flex-shrink-0">
            <Badge className={getPriorityClass(deadline.priority)}>
              {deadline.priority}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}