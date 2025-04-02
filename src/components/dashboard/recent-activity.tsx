import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  FileText, 
  MessagesSquare, 
  CheckCircle,
  Clock,
  AlertCircle,
  LogIn
} from "lucide-react";

interface ActivityProps {
  activities: Array<{
    id: string;
    type: string;
    user: {
      name: string;
      role: string;
      avatar?: string;
    };
    action: string;
    target: string;
    timestamp: string;
  }>;
  loading?: boolean;
}

export function RecentActivity({ activities, loading = false }: ActivityProps) {
  // Function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/4 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={activity.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activity.user.name}`} 
              alt={activity.user.name} 
            />
            <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {activity.user.name}
              </p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {getActivityIcon(activity.type)}
                <span>
                  {activity.action} {activity.target}
                </span>
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{activity.user.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}