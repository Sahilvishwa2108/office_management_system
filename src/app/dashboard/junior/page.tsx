"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { TaskSummary } from "@/components/dashboard/task-summary";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList as ClipboardListIcon, 
  MessageSquare as MessageSquareIcon, 
  Bell as BellIcon,
  Clock, 
  CheckCircle,
  FileText,
  Calendar
} from "lucide-react";

export default function JuniorDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  
  // Add state for task data
  useEffect(() => {
    // In a real app, fetch tasks from API
    setTimeout(() => {
      setTasks([
        { 
          id: '1', 
          title: 'Financial Report Analysis', 
          status: 'in-progress', 
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000)
        },
        { 
          id: '2', 
          title: 'Client Meeting Notes', 
          status: 'pending', 
          priority: 'medium',
          dueDate: new Date(Date.now() + 2 * 86400000)
        },
        { 
          id: '3', 
          title: 'Document Classification', 
          status: 'completed', 
          priority: 'low',
          dueDate: new Date(Date.now() - 86400000)
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {session?.user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground">
          Here's an overview of your tasks and activities
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="My Tasks"
          value={loading ? "..." : tasks.length}
          icon={<ClipboardListIcon className="h-4 w-4 text-muted-foreground" />}
          description="Assigned to you"
        />
        <StatsCard
          title="Pending Tasks"
          value={loading ? "..." : tasks.filter(t => t.status === 'pending').length}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Not started yet"
        />
        <StatsCard
          title="Completed Tasks"
          value={loading ? "..." : tasks.filter(t => t.status === 'completed').length}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
          description="This month"
        />
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <TaskSummary 
          title="My Tasks"
          tasks={tasks}
          viewAllLink="/dashboard/tasks"
          loading={loading}
          emptyMessage="You don't have any tasks assigned yet."
        />
        
        <DashboardCard title="Quick Actions" loading={loading}>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Link href="/dashboard/tasks">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardListIcon className="mr-2 h-4 w-4" />
                View Tasks
              </Button>
            </Link>
            <Link href="/dashboard/chat">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Team Chat
              </Button>
            </Link>
            <Link href="/dashboard/notifications">
              <Button variant="outline" className="w-full justify-start">
                <BellIcon className="mr-2 h-4 w-4" />
                View Notifications
              </Button>
            </Link>
            <Link href="/dashboard/documents">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </Button>
            </Link>
          </div>
        </DashboardCard>
      </div>
      
      <div className="grid gap-6 grid-cols-1">
        <DashboardCard title="Upcoming Deadlines" loading={loading}>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b">
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-red-500 mt-1" />
                    <div>
                      <p className="font-medium">Financial Report Due</p>
                      <p className="text-xs text-muted-foreground">High priority task</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    Tomorrow
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-amber-500 mt-1" />
                    <div>
                      <p className="font-medium">Client Meeting Prep</p>
                      <p className="text-xs text-muted-foreground">Medium priority task</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                    2 days left
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium">Weekly Team Meeting</p>
                      <p className="text-xs text-muted-foreground">Regular event</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    Friday
                  </Badge>
                </div>
              </>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}