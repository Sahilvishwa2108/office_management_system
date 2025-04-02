"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TaskSummary } from "@/components/dashboard/task-summary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, ClipboardList, CheckCircle, AlertCircle, Clock 
} from "lucide-react";

// Define types for the staff and task data
interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Task {
  id: string;
  title: string;
  status: "in-progress" | "pending" | "completed" | "review";
  priority: "low" | "medium" | "high";
  dueDate: Date;
}

export default function PartnerDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [taskData, setTaskData] = useState<Task[]>([]);
  
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStaffData([
        { id: '1', name: 'Jane Smith', role: 'BUSINESS_EXECUTIVE', avatar: '' },
        { id: '2', name: 'Robert Johnson', role: 'BUSINESS_CONSULTANT', avatar: '' },
        { id: '3', name: 'Emily Brown', role: 'BUSINESS_EXECUTIVE', avatar: '' },
      ]);
      
      setTaskData([
        { 
          id: '1', 
          title: 'Quarterly Report Review', 
          status: 'in-progress', 
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000) // Tomorrow
        },
        { 
          id: '2', 
          title: 'Client Meeting Preparation', 
          status: 'pending', 
          priority: 'medium',
          dueDate: new Date(Date.now() + 2 * 86400000) // Day after tomorrow
        },
        { 
          id: '3', 
          title: 'Financial Statement Review', 
          status: 'completed', 
          priority: 'low',
          dueDate: new Date(Date.now() - 86400000) // Yesterday
        },
        { 
          id: '4', 
          title: 'Team Assessment', 
          status: 'review', 
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 86400000)
        },
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);
  
  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      ?.split(' ')
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'JS';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}! Here's an overview of your team and tasks.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Quick stats */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Junior Staff"
              value={loading ? "..." : staffData.length}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              description="Total team members"
            />
            <StatsCard
              title="Active Tasks"
              value={loading ? "..." : taskData.filter(t => t.status !== 'completed').length}
              icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
              description="Tasks in progress"
            />
            <StatsCard
              title="Overdue Tasks"
              value={loading ? "..." : taskData.filter(t => 
                new Date(t.dueDate) < new Date() && t.status !== 'completed'
              ).length}
              icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
              change={{ 
                value: 2, 
                trend: "negative" 
              }}
              description="Needs attention"
            />
            <StatsCard
              title="Completed Tasks"
              value={loading ? "..." : taskData.filter(t => t.status === 'completed').length}
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
              change={{ 
                value: 25, 
                trend: "positive" 
              }}
              description="Last 30 days"
            />
          </div>
          
          {/* Main content */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Task summary */}
            <div className="md:col-span-2">
              <TaskSummary
                title="Recent Tasks"
                tasks={taskData}
                viewAllLink="/dashboard/partner/tasks"
                loading={loading}
                limit={4}
              />
            </div>
            
            {/* Staff list */}
            <div className="md:col-span-1">
              <DashboardCard 
                title="Junior Staff"
                icon="users"
                loading={loading}
              >
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                            <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : staffData.length > 0 ? (
                    <>
                      {staffData.map((staff) => (
                        <div key={staff.id} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`} 
                            />
                            <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">{staff.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {staff.role === 'BUSINESS_EXECUTIVE' ? 'Business Executive' : 'Business Consultant'}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-2">
                        <Link href="/dashboard/partner/users">
                          <Button variant="outline" size="sm" className="w-full">
                            View All Staff
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-center text-muted-foreground py-3">
                      No junior staff found.
                    </p>
                  )}
                </div>
              </DashboardCard>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard 
              title="Staff Management"
              variant="accent"
              loading={loading}
              size="sm"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Create and manage junior staff</p>
                <Link href="/dashboard/partner/users/create">
                  <Button size="sm" className="w-full">Create Junior Staff</Button>
                </Link>
              </div>
            </DashboardCard>
            
            <DashboardCard 
              title="Task Management"
              variant="accent"
              loading={loading}
              size="sm"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Assign and manage tasks</p>
                <Link href="/dashboard/partner/tasks">
                  <Button size="sm" className="w-full">Manage Tasks</Button>
                </Link>
              </div>
            </DashboardCard>
            
            <DashboardCard 
              title="Team Chat"
              variant="accent"
              loading={loading}
              size="sm"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Communicate with your team</p>
                <Link href="/dashboard/chat">
                  <Button size="sm" className="w-full">Open Chat</Button>
                </Link>
              </div>
            </DashboardCard>
            
            <DashboardCard 
              title="Settings"
              variant="accent"
              loading={loading}
              size="sm"
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Update your preferences</p>
                <Link href="/dashboard/settings">
                  <Button size="sm" className="w-full">Open Settings</Button>
                </Link>
              </div>
            </DashboardCard>
          </div>
        </TabsContent>
        
        <TabsContent value="team">
          <DashboardCard title="Team Management">
            <Link href="/dashboard/partner/users">
              <Button>View Team Management</Button>
            </Link>
          </DashboardCard>
        </TabsContent>
        
        <TabsContent value="tasks">
          <DashboardCard title="Task Management">
            <Link href="/dashboard/partner/tasks">
              <Button>View Task Management</Button>
            </Link>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}