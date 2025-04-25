"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import Image from 'next/image';

// Enhanced interface to accept Next.js Image props
interface ExtendedAvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  src: string;
  alt?: string;
  size?: number;
  priority?: boolean;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// Enhanced AvatarImage component that uses Next.js Image
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  ExtendedAvatarImageProps
>(({ className, src, alt = "", size = 40, priority = false, ...props }, ref) => {
  // Better validation for src
  const isValidSrc = typeof src === 'string' && src.trim().length > 0;
  const isRemoteUrl = isValidSrc && (src.startsWith('http') || src.startsWith('https'));
  
  if (!isValidSrc) {
    return null;
  }
  
  return (
    <div className="aspect-square h-full w-full">
      {isRemoteUrl ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={cn("aspect-square h-full w-full object-cover", className)}
          priority={priority}
          onError={(e) => {
            // Hide the image on error
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <AvatarPrimitive.Image
          ref={ref}
          className={cn("aspect-square h-full w-full object-cover", className)}
          src={src}
          alt={alt}
          {...props}
        />
      )}
    </div>
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback }
