import { formatDistanceToNow } from "date-fns";
import { 
  User, 
  FileText, 
  MessagesSquare, 
  CheckCircle,
  Clock,
  AlertCircle,
  LogIn
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface JuniorActivityProps {
  activities: Array<{
    id: string;
    type: string;
    action: string;
    target: string;
    timestamp: string;
  }>;
  loading?: boolean;
  expanded?: boolean; // Show more details and more activities
}

export function JuniorActivity({ 
  activities, 
  loading = false, 
  expanded = false 
}: JuniorActivityProps) {
  // Function to get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "user":
        return <User className="h-4 w-4 text-blue-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "message":
        return <MessagesSquare className="h-4 w-4 text-purple-500" />;
      case "task":
        return <CheckCircle className="h-4 w-4 text-amber-500" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-red-500" />;
      case "login":
        return <LogIn className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to format activity timestamp
  const formatTimestamp = (timestamp: string, expanded: boolean) => {
    const date = new Date(timestamp);
    
    if (expanded) {
      return date.toLocaleString();
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(expanded ? 7 : 4)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="mt-1 h-4 w-4 rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/3 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
        <p className="text-sm text-muted-foreground">No activity recorded yet</p>
      </div>
    );
  }

  const displayActivities = expanded ? activities : activities.slice(0, 5);

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => (
        <div key={activity.id}>
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-medium">You</span> {activity.action} {activity.target}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(activity.timestamp, expanded)}
                </span>
              </div>
              {expanded && (
                <p className="text-xs text-muted-foreground">
                  Activity type: {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                </p>
              )}
            </div>
          </div>
          {index < displayActivities.length - 1 && <Separator className="my-3" />}
        </div>
      ))}
      
      {!expanded && activities.length > 5 && (
        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground">
            + {activities.length - 5} more activities
          </p>
        </div>
      )}
    </div>
  );
}