"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "4rem";

interface NavItemProps {
  title: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  role: string[];
}

interface SidebarProps {
  navItems: NavItem[];
  pathname: string;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  userName: string;
  userRole: string;
  onSignOut: () => void;
}

const NavItem = ({ title, href, icon, active, collapsed }: NavItemProps) => {
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {!collapsed && <span>{title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-normal">
            {title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export function Sidebar({
  navItems,
  pathname,
  collapsed,
  setCollapsed,
  userName,
  userRole,
  onSignOut,
}: SidebarProps) {
  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format role for display
  const formatRole = (role: string) => {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isActiveNavItem = (itemHref: string) => {
    // Exact match for the current path
    if (pathname === itemHref) {
      return true;
    }

    // Highlight child items only, not the parent
    if (pathname.startsWith(`${itemHref}/`) && pathname !== itemHref) {
      return false; // Prevent parent from being highlighted
    }

    return false;
  };

  return (
    <div
      className="flex flex-col border-r bg-background relative transition-all duration-300"
      style={{ width: collapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH }}
    >
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* Header/Logo */}
      <div className="flex h-14 items-center border-b px-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <path d="M3 9V5a2 2 0 0 1-2-2h14a2 2 0 0 1-2 2v4" />
            <path d="M13 13h4" />
            <path d="M13 17h4" />
            <path d="M9 13h.01" />
            <path d="M9 17h.01" />
          </svg>
          {!collapsed && (
            <span className="font-semibold">Office Pilot</span>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => (
            <NavItem
              key={index}
              title={item.title}
              href={item.href}
              icon={item.icon}
              active={isActiveNavItem(item.href)} // Use refined logic
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto border-t p-3">
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate font-medium">{userName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {formatRole(userRole)}
              </span>
            </div>
          )}
        </div>

        {/* Logout button */}
        <div className="mt-3">
          <Button
            variant="outline"
            size={collapsed ? "icon" : "default"}
            className={cn("w-full", collapsed && "justify-center")}
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
