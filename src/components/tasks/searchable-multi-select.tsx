"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDown, Filter, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Option {
  value: string;
  label: string;
  role?: string;
  email?: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayed?: number;
  className?: string;
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  disabled = false,
  maxDisplayed = 3,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  
  // Extract unique roles from options
  const uniqueRoles = Array.from(new Set(
    options
      .map(option => option.role)
      .filter(Boolean) as string[]
  )).sort();
  
  // Format role to be more readable
  const formatRole = (role: string): string => {
    if (!role) return "";
    return role.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Find options matching the selected values
  const selectedOptions = options.filter(option => selected.includes(option.value));
  
  // Filter options based on search query and role filters
  const filteredOptions = options.filter(option => {
    // Apply role filter if any roles are selected
    if (selectedRoles.length > 0 && option.role) {
      if (!selectedRoles.includes(option.role)) {
        return false;
      }
    }
    
    // If no search query, return all options that passed the role filter
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    // Use a more direct string comparison approach
    if (option.label && option.label.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    if (option.email && option.email.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    if (option.role) {
      const formattedRole = formatRole(option.role).toLowerCase();
      if (formattedRole.includes(searchLower)) {
        return true;
      }
    }
    
    return false;
  });
  
  // Debug logging
  useEffect(() => {
    if (searchQuery) {
      console.log("Current search query:", searchQuery);
      console.log("Filtered options count:", filteredOptions.length);
      console.log("First few filtered options:", filteredOptions.slice(0, 3));
    }
  }, [searchQuery, filteredOptions]);
  
  // Toggle selection
  const toggleOption = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value]
    );
  };
  
  // Toggle role filter
  const toggleRoleFilter = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };
  
  // Remove a selected item
  const removeItem = (value: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };
  
  // Clear all role filters
  const clearRoleFilters = () => {
    setSelectedRoles([]);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {selectedOptions.slice(0, maxDisplayed).map(option => (
              <Badge
                key={option.value}
                variant="secondary"
                className="flex items-center gap-1 pl-1 pr-0.5 py-0"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${option.label}`} />
                  <AvatarFallback className="text-[10px]">{getInitials(option.label)}</AvatarFallback>
                </Avatar>
                <span>{option.label}</span>
                {/* Use span instead of button to avoid nesting issue */}
                <span
                  onClick={(e) => removeItem(option.value, e)}
                  className="h-4 w-4 p-0 ml-1 cursor-pointer rounded-full hover:bg-gray-200 inline-flex items-center justify-center"
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${option.label}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))}
            {selected.length > maxDisplayed && (
              <Badge variant="secondary">+{selected.length - maxDisplayed} more</Badge>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}> {/* Important: disable built-in filtering */}
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search people..."
              value={searchQuery}
              onValueChange={(value) => {
                console.log("Search query changed to:", value);
                setSearchQuery(value);
              }}
              className="h-9 flex-1"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRoleFilter(!showRoleFilter)}
              className={cn(
                "ml-1 h-8 w-8", 
                selectedRoles.length > 0 && "text-primary",
                showRoleFilter && "bg-accent"
              )}
              aria-label="Filter by role"
            >
              <Filter className="h-4 w-4" />
              {selectedRoles.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                  {selectedRoles.length}
                </span>
              )}
            </Button>
          </div>
          
          {showRoleFilter && (
            <div className="border-b p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Filter by role</span>
                {selectedRoles.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearRoleFilters}
                    className="h-7 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {uniqueRoles.map(role => (
                  <Badge 
                    key={role} 
                    variant={selectedRoles.includes(role) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRoleFilter(role)}
                  >
                    {formatRole(role)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <CommandList>
            <CommandEmpty>No matching people found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Important: use label for searching
                  onSelect={() => toggleOption(option.value)}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    className="mr-2"
                  />
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${option.label}`} />
                    <AvatarFallback>{getInitials(option.label)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.role && (
                      <span className="text-xs text-muted-foreground">{formatRole(option.role)}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}