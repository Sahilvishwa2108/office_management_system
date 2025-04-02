"use client";

import { Card } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface RoleConfig {
  role: string;
  label: string;
  color: string;
}

interface UserCountProps {
  users: User[];
  title?: string;
  description?: string;
  excludeRoles?: string[];
  includeRoles?: string[];
  roleConfigs: RoleConfig[];
  showTotal?: boolean;
}

export function UserCount({
  users,
  title = "User Role Distribution",
  description = "Overview of user distribution across different roles",
  excludeRoles = [],
  includeRoles,
  roleConfigs,
  showTotal = false,
}: UserCountProps) {
  // Filter users based on role inclusion/exclusion
  const filteredUsers = users.filter(user => {
    if (includeRoles?.length) {
      return includeRoles.includes(user.role);
    }
    if (excludeRoles?.length) {
      return !excludeRoles.includes(user.role);
    }
    return true;
  });

  // Count users by role
  const roleCounts = filteredUsers.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate total users for the progress bar
  const totalUsersCount = filteredUsers.length;

  // Filter roleConfigs to only include roles that exist in our filtered users
  const displayedRoles = roleConfigs.filter(config => 
    roleCounts[config.role] !== undefined && roleCounts[config.role] > 0
  );

  return (
    <Card className="p-4">
      <div className="mb-2">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
          {showTotal && totalUsersCount > 0 && ` (Total: ${totalUsersCount})`}
        </p>
        
        {/* Single Progress Bar showing role distribution */}
        {totalUsersCount > 0 && (
          <div className="space-y-4">
            <div className="flex w-full rounded-full overflow-hidden h-2.5">
              {displayedRoles.map((config, idx) => {
                const count = roleCounts[config.role] || 0;
                const percentage = (count / totalUsersCount) * 100;
                
                return (
                  <div
                    key={idx}
                    className={`${config.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                );
              })}
            </div>

            {/* Role Legend with Counts */}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {displayedRoles.map((config, idx) => {
                const count = roleCounts[config.role] || 0;
                
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${config.color}`}></div>
                    <span>{config.label}</span>
                    <span className="text-muted-foreground font-medium">
                      ({count})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {totalUsersCount === 0 && (
          <p className="text-sm text-muted-foreground">No users found</p>
        )}
      </div>
    </Card>
  );
}