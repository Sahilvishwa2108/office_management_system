"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Users as UsersIcon, 
  UserCheck, 
  Briefcase, 
  Activity, 
  ArrowRight,
  Plus,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { TaskProgress } from "@/components/dashboard/task-progress";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsSkeleton, DashboardContentSkeleton } from "@/components/loading/dashboard-skeleton";
import { PendingBillingTasks } from "@/components/admin/pending-billing-tasks";
import { RecentNotificationsCard } from "@/components/dashboard/recent-notifications-card";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo?: {
    name: string;
  } | null;
}

interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalClients: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasksCount: number;
    newUsersThisMonth: number;
  };
  recentActivities: Array<{
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
  tasks: Task[];
}

// Main dashboard component
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const tab = url.searchParams.get('tab');
        if (tab && (tab === 'overview' || tab === 'analytics' || tab === 'activities')) {
          setActiveTab(tab);
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

  // Fetch admin dashboard data - only the tasks for the Overview tab
  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Make API call to fetch dashboard data
      const response = await fetch('/api/admin/dashboard?dataType=overview');
      
      if (!response.ok) {
        throw new Error(`Error fetching dashboard data: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(prev => ({
        ...prev,
        stats: prev?.stats || {
          totalUsers: 0,
          activeUsers: 0,
          totalClients: 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          overdueTasksCount: 0,
          newUsersThisMonth: 0
        },
        recentActivities: prev?.recentActivities || [],
        tasks: data.tasks || []
      }));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats data for Analytics tab
  const fetchStatsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Make API call to fetch analytics data
      const response = await fetch('/api/admin/dashboard?dataType=analytics');
      
      if (!response.ok) {
        throw new Error(`Error fetching analytics data: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData(prev => ({
        ...prev,
        stats: data.stats || {
          totalUsers: 0,
          activeUsers: 0,
          totalClients: 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          overdueTasksCount: 0,
          newUsersThisMonth: 0
        },
        recentActivities: prev?.recentActivities || [],
        tasks: prev?.tasks || []
      }));
      setStatsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch stats data:', err);
      setError('Failed to load stats data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data for Overview tab
  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Conditionally load data based on active tab
  useEffect(() => {
    if (activeTab === "analytics" && !statsLoaded) {
      fetchStatsData();
    }
  }, [activeTab, statsLoaded]);

  // Update URL when tab changes without using router
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', value);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Calculate stats for display
  const stats = dashboardData?.stats || {
    totalUsers: 0,
    activeUsers: 0,
    totalClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasksCount: 0,
    newUsersThisMonth: 0
  };

  // Calculate percentage of active users
  const activeUserPercentage = useMemo(() => {
    return stats.totalUsers > 0 
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100) 
      : 0;
  }, [stats.activeUsers, stats.totalUsers]);

  // Loading state for dashboard data
  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <DashboardStatsSkeleton />
            <DashboardContentSkeleton />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/dashboard/admin/users/create">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Link>
        </Button>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {loading && !dashboardData?.tasks ? (
            <>
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notifications Card */}
                <RecentNotificationsCard />
                
                {/* Quick Actions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <Link href="/dashboard/admin/users">
                      <Button variant="outline" className="w-full justify-between">
                        Manage Users
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/admin/clients">
                      <Button variant="outline" className="w-full justify-between">
                        Manage Clients
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/tasks">
                      <Button variant="outline" className="w-full justify-between">
                        View All Tasks
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/tasks/create">
                      <Button variant="outline" className="w-full justify-between">
                        Create New Task
                        <Plus className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/admin/documents">
                      <Button variant="outline" className="w-full justify-between">
                        Document Repository
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/settings">
                      <Button variant="outline" className="w-full justify-between">
                        System Settings
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-3 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Task Status</CardTitle>
                    <CardDescription>Tasks that need immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.tasks && dashboardData.tasks
                        .filter(task => task.priority === 'high' && task.status !== 'completed')
                        .slice(0, 3)
                        .map(task => (
                          <div 
                            key={task.id} 
                            className="border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{task.title}</h3>
                              <Badge className="bg-red-500">{task.priority}</Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-sm">
                              <span className="text-muted-foreground">
                                {task.assignedTo ? `Assigned to: ${task.assignedTo.name}` : "Unassigned"}
                              </span>
                              <Badge variant="outline" className="bg-muted">
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    
                      {dashboardData?.tasks && dashboardData.tasks.length > 0 && 
                       dashboardData.tasks.filter(task => task.priority === 'high' && task.status !== 'completed').length === 0 && (
                        <div className="text-center py-6">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2 opacity-50" />
                          <p className="text-muted-foreground">No high priority tasks</p>
                        </div>
                      )}
                      
                      {(!dashboardData?.tasks || dashboardData.tasks.length === 0) && (
                        <div className="text-center py-6">
                          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                          <p className="text-muted-foreground mb-4">No tasks created yet</p>
                          <Button onClick={() => router.push('/dashboard/tasks/create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Task
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-3 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Pending Billing Tasks</CardTitle>
                    <CardDescription>Tasks ready for billing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PendingBillingTasks />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6">
          {loading && !statsLoaded ? (
            <>
              <DashboardStatsSkeleton />
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              {/* Metrics section */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <OverviewStats 
                  title="Total Users" 
                  value={stats.totalUsers.toString()} 
                  description={`${activeUserPercentage}% active`}
                  icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />} 
                />
                <OverviewStats 
                  title="Active Users" 
                  value={stats.activeUsers.toString()} 
                  icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} 
                />
                <OverviewStats 
                  title="Total Clients" 
                  value={stats.totalClients.toString()} 
                  icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} 
                />
                <OverviewStats 
                  title="Active Tasks" 
                  value={stats.totalTasks.toString()} 
                  icon={<Activity className="h-4 w-4 text-muted-foreground" />} 
                />
              </div>

              {/* User statistics cards */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <DashboardCard title="User Analytics" loading={!statsLoaded} className="col-span-1 lg:col-span-1">
                  {statsLoaded && !error && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Activity Overview</h3>
                        <Badge variant="outline">{activeUserPercentage}% active</Badge>
                      </div>
                      
                      <Progress value={activeUserPercentage} className="h-2" />
                      
                      <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{stats.activeUsers}</p>
                          <p className="text-xs text-muted-foreground">Active</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{stats.totalUsers - stats.activeUsers}</p>
                          <p className="text-xs text-muted-foreground">Inactive</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{Math.round(stats.totalTasks / (stats.activeUsers || 1) * 10) / 10}</p>
                          <p className="text-xs text-muted-foreground">Tasks/User</p>
                        </div>
                      </div>
                    </div>
                  )}
                </DashboardCard>
                    
                <DashboardCard title="Task Performance" loading={!statsLoaded} className="col-span-1 lg:col-span-2">
                  {statsLoaded && !error && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.completedTasks}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.inProgressTasks}</p>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                        <div className="p-2 bg-muted/20 rounded-md">
                          <p className="text-2xl font-bold">{stats.overdueTasksCount}</p>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Task Status Distribution</span>
                          <span>{stats.totalTasks} total</span>
                        </div>
                        <TaskProgress 
                          items={[
                            { label: "Completed", value: stats.completedTasks || 0, color: "bg-green-500" },
                            { label: "In Progress", value: stats.inProgressTasks || 0, color: "bg-blue-500" },
                            { label: "Pending", value: stats.pendingTasks || 0, color: "bg-amber-500" },
                            { label: "Overdue", value: stats.overdueTasksCount || 0, color: "bg-red-500" }
                          ]}
                          size="lg"
                          showLabels={true}
                          showPercentages={true}
                        />
                      </div>
                    </div>
                  )}
                </DashboardCard>
              </div>
            </>
          )}
        </TabsContent>

        {/* ACTIVITIES TAB */}
        <TabsContent value="activities" className="space-y-4">
          <DashboardCard title="Recent Activity" className="w-full" loading={activeTab === "activities" && loading}>
            {activeTab === "activities" && (
              <ActivityFeed 
                fetchUrl="/api/activities"
                loading={false} 
                showUserInfo={true}
                showRoleInfo={true}
                expanded={true}
                maxHeight="calc(20 * 72px)"
                limit={20}
              />
            )}
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}