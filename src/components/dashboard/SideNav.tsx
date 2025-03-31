"use client"

import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { 
  Home, 
  CheckSquare, 
  Users, 
  MessageSquare,
  Bell, 
  ShieldCheck, 
  UserPlus 
} from "lucide-react"

import { UserRole } from "@/lib/prisma-types"
import { ROLE_HIERARCHY } from "@/lib/types"
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter
} from "@/components/ui/sidebar"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  requiredRole: UserRole
}

export default function SideNav() {
  const { user } = useUser()
  const pathname = usePathname()
  const userRole = user?.publicMetadata?.role as UserRole | undefined
  
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      requiredRole: "BUSINESS_CONSULTANT" as UserRole,
    },
    {
      label: "Tasks",
      href: "/dashboard/tasks",
      icon: <CheckSquare className="h-5 w-5" />,
      requiredRole: "BUSINESS_CONSULTANT" as UserRole,
    },
    {
      label: "Team",
      href: "/dashboard/team",
      icon: <Users className="h-5 w-5" />,
      requiredRole: "PARTNER" as UserRole,
    },
    {
      label: "Add Employee",
      href: "/dashboard/add-employee",
      icon: <UserPlus className="h-5 w-5" />,
      requiredRole: "PARTNER" as UserRole,
    },
    {
      label: "Chat",
      href: "/dashboard/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      requiredRole: "BUSINESS_CONSULTANT" as UserRole,
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: <Bell className="h-5 w-5" />,
      requiredRole: "BUSINESS_CONSULTANT" as UserRole,
    },
    {
      label: "Admin Panel",
      href: "/dashboard/admin",
      icon: <ShieldCheck className="h-5 w-5" />,
      requiredRole: "ADMIN" as UserRole,
    },
  ]
  
  // Function to check if a user can access a route based on role
  const canAccess = (requiredRole: UserRole) => {
    if (!userRole || !(userRole in ROLE_HIERARCHY)) {
      return false
    }
    
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
  }
  
  // Filter navigation items based on user's role
  const filteredNavItems = navItems.filter(item => canAccess(item.requiredRole))

  // Group navigation items by category
  const adminItems = filteredNavItems.filter(item => 
    item.href.includes('/admin') || item.label === 'Team' || item.label === 'Add Employee'
  )
  
  const generalItems = filteredNavItems.filter(item => 
    !item.href.includes('/admin') && item.label !== 'Team' && item.label !== 'Add Employee'
  )
  
  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <div className="flex items-center p-2">
            <SidebarTrigger className="mr-2" />
            <h2 className="text-xl font-semibold">Office Manager</h2>
          </div>
        </SidebarHeader>
        
        <SidebarSeparator />
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>General</SidebarGroupLabel>
            <SidebarMenu>
              {generalItems.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
          
          {adminItems.length > 0 && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
        
        <SidebarFooter className="mt-auto">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <p>Office Management System v1.0</p>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}