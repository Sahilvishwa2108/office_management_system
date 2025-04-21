"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { canModifyClient } from "@/lib/permissions";

interface ClientActionButtonsProps {
  clientId: string;
  onDeleteClick?: () => void;
}

export function ClientActionButtons({ clientId, onDeleteClick }: ClientActionButtonsProps) {
  const { data: session } = useSession();
  const canModify = canModifyClient(session);
  
  // If user can't modify clients, don't render any buttons
  if (!canModify) return null;
  
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/clients/${clientId}/edit`}>
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Link>
      </Button>
      
      {onDeleteClick && (
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      )}
    </div>
  );
}