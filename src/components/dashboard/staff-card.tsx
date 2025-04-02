import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StaffCardProps {
  id: string;
  name: string;
  email: string;
  role: string;
  imageSrc?: string;
  activeTasks: number;
  completedTasks: number;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
}

export function StaffCard({
  id,
  name,
  email,
  role,
  imageSrc,
  activeTasks,
  completedTasks,
  status
}: StaffCardProps) {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "BUSINESS_CONSULTANT":
        return "Business Consultant";
      case "BUSINESS_EXECUTIVE":
        return "Business Executive";
      default:
        return role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ");
    }
  };

  // Get status display style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      case "ON_LEAVE":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={imageSrc || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
                alt={name}
              />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription className="text-xs">{email}</CardDescription>
            </div>
          </div>
          <Badge className={getStatusStyle(status)}>
            {status === "ON_LEAVE" ? "On Leave" : status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-sm">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium">{getRoleDisplayName(role)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Active Tasks:</span>
            <span className="font-medium">{activeTasks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed Tasks:</span>
            <span className="font-medium">{completedTasks}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/dashboard/partner/users/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}