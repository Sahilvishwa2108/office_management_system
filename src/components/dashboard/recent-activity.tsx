import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  FileText, 
  MessagesSquare, 
  CheckCircle,
  Clock,
  AlertCircle,
  LogIn,
  LogOut,
  UserCog,
  Trash2,
  PlusCircle,
  Briefcase,
  ClipboardList
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea component
import { Button } from "@/components/ui/button"; // Import Button component
import Link from "next/link"; // Import Link component

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

  // Enhanced function to get appropriate icon based on activity type AND action
  const getActivityIcon = (type: string, action: string) => {
    // First check for special combinations of type + action
    if (type === "user" && action === "login") {
      return <LogIn className="h-4 w-4 text-blue-500" />;
    }
    if (type === "user" && action === "logout") {
      return <LogOut className="h-4 w-4 text-blue-500" />;
    }
    if (type === "user" && action === "role_changed") {
      return <UserCog className="h-4 w-4 text-purple-500" />;
    }
    if (type === "user" && action === "created") {
      return <PlusCircle className="h-4 w-4 text-green-500" />;
    }
    if (type === "user" && action === "deleted") {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    
    // Otherwise fall back to type-based icons
    switch (type.toLowerCase()) {
      case "user":
        return <User className="h-4 w-4 text-blue-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "message":
        return <MessagesSquare className="h-4 w-4 text-purple-500" />;
      case "task":
        return action === "completed" 
          ? <CheckCircle className="h-4 w-4 text-emerald-500" />
          : <ClipboardList className="h-4 w-4 text-amber-500" />;
      case "client":
        return <Briefcase className="h-4 w-4 text-amber-500" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format the activity message more intelligently
  const formatActivityMessage = (type: string, action: string, target: string) => {
    // Special cases for more readable messages
    if (type === "user" && action === "role_changed") {
      return `changed role for ${target}`;
    }
    
    if (type === "task" && action === "assigned") {
      return `assigned ${target}`;
    }
    
    if (type === "user" && (action === "login" || action === "logout")) {
      return action === "login" ? "logged in" : "logged out";
    }
    
    // Default formatting
    return `${action} ${target}`;
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
    // Add a ScrollArea with fixed height of approximately 5 items
    <ScrollArea className="h-[360px] pr-4 rounded-md">
      <div className="space-y-4 pr-2">
        {activities.map((activity) => (
          <TooltipProvider key={activity.id}>
            <div className="flex items-start gap-4">
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-help">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {new Date(activity.timestamp).toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {getActivityIcon(activity.type, activity.action)}
                    <span>
                      {formatActivityMessage(activity.type, activity.action, activity.target)}
                    </span>
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.user.role}</p>
              </div>
            </div>
          </TooltipProvider>
        ))}
      </div>
      <div className="mt-2 text-center">
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href="/dashboard/activities">View all activities</Link>
        </Button>
      </div>
    </ScrollArea>
  );
}