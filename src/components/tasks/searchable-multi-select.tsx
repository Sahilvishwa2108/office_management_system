"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";

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
  
  // Format role to be more readable
  const formatRole = (role: string): string => {
    return role?.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Find options matching the selected values
  const selectedOptions = options.filter(option => selected.includes(option.value));
  
  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (option.role && formatRole(option.role).toLowerCase().includes(searchQuery.toLowerCase())) ||
    (option.email && option.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Toggle selection
  const toggleOption = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value]
    );
  };
  
  // Remove a selected item
  const removeItem = (value: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
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
                {/* Replace Button with a span that's styled like a button */}
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
        <Command>
          <CommandInput
            placeholder="Search people..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
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