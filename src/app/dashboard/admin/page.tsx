"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  BarChart, 
  Users as UsersIcon, 
  UserCheck, 
  Briefcase, 
  Activity, 
  ArrowRight,
  Plus
} from "lucide-react";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardCard } from "@/components/ui/dashboard-card";

interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalClients: number;
    totalTasks: number;
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
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    fetchDashboardData();
  }, []);

  // Calculate stats for display
  const stats = dashboardData?.stats || {
    totalUsers: 0,
    activeUsers: 0,
    totalClients: 0,
    totalTasks: 0
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
                <RecentActivity 
                  activities={dashboardData?.recentActivities || []}
                  loading={loading}
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
          <DashboardCard title="User Analytics" loading={loading}>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {loading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : error ? (
                <p>Failed to load analytics data.</p>
              ) : (
                <div className="text-center">
                  <BarChart className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-2">Analytics will be available in the next update</p>
                </div>
              )}
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}