"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  avatar?: string;
}

interface SearchableSelectProps {
  options: Option[];
  selected: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  selected,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  
  // Find the selected option
  const selectedOption = options.find(option => option.value === selected);
  
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
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedOption.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedOption.label}`} />
                <AvatarFallback className="text-[10px]">{getInitials(selectedOption.label)}</AvatarFallback>
              </Avatar>
              <span>{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." autoFocus />
          <CommandList>
            <CommandEmpty>No matches found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="null"
                onSelect={() => {
                  onChange("null");
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <span className="text-muted-foreground">No Client</span>
                {selected === "null" && <Check className="ml-auto h-4 w-4" />}
              </CommandItem>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={option.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${option.label}`} />
                      <AvatarFallback>{getInitials(option.label)}</AvatarFallback>
                    </Avatar>
                    <span>{option.label}</span>
                  </div>
                  {selected === option.value && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}