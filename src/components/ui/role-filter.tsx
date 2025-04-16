"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleFilterProps {
  roles: { value: string; label: string }[];
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
  buttonClassName?: string;
}

export function RoleFilter({
  roles,
  selectedRoles,
  onChange,
  buttonClassName,
}: RoleFilterProps) {
  const [open, setOpen] = useState(false);
  
  // Toggle role selection
  const toggleRole = (role: string) => {
    const newSelection = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    
    onChange(newSelection);
  };
  
  // Clear all selections
  const clearAll = () => {
    onChange([]);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "border-dashed gap-1", 
            selectedRoles.length > 0 && "text-primary border-primary",
            buttonClassName
          )}
        >
          <Filter className="h-4 w-4" />
          Filter Roles
          {selectedRoles.length > 0 && (
            <Badge 
              variant="secondary" 
              className="rounded-sm px-1 font-normal"
            >
              {selectedRoles.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-3" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filter by Role</h4>
            {selectedRoles.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={clearAll}
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge 
                key={role.value} 
                variant={selectedRoles.includes(role.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleRole(role.value)}
              >
                {role.label}
                {selectedRoles.includes(role.value) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}