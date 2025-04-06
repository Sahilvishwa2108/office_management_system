"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  BarChart, 
  Users as UsersIcon, 
  UserCheck, 
  Briefcase, 
  Activity, 
  ArrowRight,
  Plus,
  CheckCircle,
  ClipboardList,
  CheckSquare
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { TaskMetrics } from "@/components/dashboard/task-metrics";
import { TaskSummary } from "@/components/dashboard/task-summary"; 
import { TaskProgress } from "@/components/dashboard/task-progress";
import { useRouter } from "next/navigation";

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

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Make API call to fetch dashboard data
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.status}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch data initially
    fetchDashboardData();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Poll every 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

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
  const activeUserPercentage = stats.totalUsers > 0 
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100) 
    : 0;

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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <OverviewStats 
              title="Total Users" 
              value={loading ? "..." : stats.totalUsers.toString()} 
              description={`${activeUserPercentage}% active`}
              icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />} 
            />
            <OverviewStats 
              title="Active Users" 
              value={loading ? "..." : stats.activeUsers.toString()} 
              icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} 
            />
            <OverviewStats 
              title="Total Clients" 
              value={loading ? "..." : stats.totalClients.toString()} 
              icon={<Briefcase className="h-4 w-4 text-muted-foreground" />} 
            />
            <OverviewStats 
              title="Active Tasks" 
              value={loading ? "..." : stats.totalTasks.toString()} 
              icon={<Activity className="h-4 w-4 text-muted-foreground" />} 
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-3 lg:col-span-1">
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>Overall task distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
                    <div className="h-8 w-full bg-muted rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <TaskProgress 
                      items={[
                        { label: "Completed", value: stats.completedTasks || 0, color: "bg-green-500" },
                        { label: "In Progress", value: stats.inProgressTasks || 0, color: "bg-blue-500" },
                        { label: "Pending", value: stats.pendingTasks || 0, color: "bg-amber-500" },
                        { label: "Overdue", value: stats.overdueTasksCount || 0, color: "bg-red-500" }
                      ]}
                      size="md"
                      showLabels={true}
                      showPercentages={true}
                    />
                    
                    <Button asChild variant="outline" className="w-full mt-4">
                      <Link href="/dashboard/admin/tasks">
                        View All Tasks
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {dashboardData?.tasks && dashboardData.tasks.length > 0 ? (
              <Card className="col-span-3 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Priority Tasks</CardTitle>
                    <CardDescription>Tasks that need immediate attention</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => router.push('/dashboard/admin/tasks/create')}>
                    <Plus className="mr-2 h-3 w-3" />
                    New Task
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.tasks
                      .filter(task => task.priority === 'high' && task.status !== 'completed')
                      .slice(0, 3)
                      .map(task => (
                        <div 
                          key={task.id} 
                          className="border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/admin/tasks/${task.id}`)}
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
                    
                    {dashboardData.tasks.filter(task => task.priority === 'high' && task.status !== 'completed').length === 0 && (
                      <div className="text-center py-6">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">No high priority tasks</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="col-span-3 lg:col-span-2">
                <CardContent className="flex items-center justify-center h-64">
                  {loading ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <div className="text-center">
                      <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                      <p className="text-muted-foreground mb-4">No tasks created yet</p>
                      <Button onClick={() => router.push('/dashboard/admin/tasks/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Task
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <DashboardCard title="Recent Activity" className="col-span-4" loading={loading}>
              {error ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <ActivityFeed 
                  activities={dashboardData?.recentActivities}
                  loading={loading}
                  viewAllUrl="/dashboard/activities"
                  showUserInfo={true}
                  showRoleInfo={true}
                />
              )}
            </DashboardCard>
            
            <Card className="col-span-3">
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
                <Link href="/dashboard/admin/tasks">
                  <Button variant="outline" className="w-full justify-between">
                    View All Tasks
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/dashboard/admin/documents">
                  <Button variant="outline" className="w-full justify-between">
                    Document Repository
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.newUsersThisMonth} new this month
                </p>
              </CardContent>
            </Card>
            {/* Other statistics cards... */}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard title="Task Performance" loading={loading} className="col-span-3 lg:col-span-1">
              {!loading && !error && (
                <div className="space-y-6">
                  <TaskMetrics metrics={[
                    {
                      label: "Completion Rate",
                      value: Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100),
                      change: 5,  // This would ideally come from the API comparing to previous period
                      changeType: "increase"
                    },
                    {
                      label: "On-time Delivery",
                      value: Math.round(((stats.completedTasks - (stats.overdueTasksCount || 0)) / (stats.completedTasks || 1)) * 100),
                      change: -2, 
                      changeType: "decrease"
                    },
                    {
                      label: "Tasks per User",
                      value: Math.round(stats.totalTasks / (stats.activeUsers || 1) * 10) / 10,
                      change: 0.2,
                      changeType: "increase"
                    },
                    {
                      label: "Overdue Tasks",
                      value: stats.overdueTasksCount || 0,
                      change: stats.overdueTasksCount > 0 ? 10 : -5,
                      changeType: stats.overdueTasksCount > 0 ? "increase" : "decrease"
                    }
                  ]} />
                </div>
              )}
            </DashboardCard>
            
            <DashboardCard title="User Analytics" loading={loading} className="col-span-3 lg:col-span-2">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : error ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Failed to load analytics data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Users</h3>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">{activeUserPercentage}% of total users</p>
                  </div>
                  <div className="col-span-1 border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Tasks</h3>
                    <div className="text-2xl font-bold">{Math.round(stats.totalTasks / (stats.activeUsers || 1) * 10) / 10}</div>
                    <p className="text-xs text-muted-foreground mt-1">Tasks per active user</p>
                  </div>
                  <div className="col-span-1 border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Rate</h3>
                    <div className="text-2xl font-bold">{activeUserPercentage}%</div>
                    <p className="text-xs text-muted-foreground mt-1">{stats.activeUsers} of {stats.totalUsers} users</p>
                  </div>
                </div>
              )}
            </DashboardCard>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trend</CardTitle>
                <CardDescription>Monthly task completion rates</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {loading ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : error ? (
                  <p>Failed to load chart data.</p>
                ) : (
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2">Chart visualization coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>Tasks by status and priority</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                {loading ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : error ? (
                  <p>Failed to load chart data.</p>
                ) : (
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2">Chart visualization coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}