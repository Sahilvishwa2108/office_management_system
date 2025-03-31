import { RoleGate } from "@/components/auth/RoleGate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { Bell, CheckSquare, MessageSquare } from "lucide-react"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }
  
  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const role = user?.publicMetadata?.role as string
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Welcome, {user.firstName}!</h2>
      <p className="text-muted-foreground">
        This is your dashboard. Here's an overview of your workspace.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              8 pending, 4 completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              2 unread messages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Since your last login
            </p>
          </CardContent>
        </Card>
      </div>
      
      <RoleGate allowedRole="ADMIN">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admin Overview</CardTitle>
            <CardDescription>
              This section is only visible to administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Here you can see system-wide metrics and controls.</p>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  )
}