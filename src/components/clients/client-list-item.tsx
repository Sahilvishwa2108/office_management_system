import React, { memo } from 'react';
import { Client } from '@/types/client';

interface ClientListItemProps {
  client: Client;
  confirmDelete: (id: string) => void;
  canDelete: boolean;
}

// Use memo to prevent unnecessary re-renders when parent component changes
const ClientListItem = memo(({ 
  client, 
  confirmDelete,
  canDelete 
}: ClientListItemProps) => {
  // Component implementation...
  
  return (
    <div className="p-4 border rounded-lg mb-4 hover:bg-muted/50 cursor-pointer transition-colors">
      {/* Component content... */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to determine if the component should re-render
  return (
    prevProps.client.id === nextProps.client.id &&
    prevProps.client.updatedAt === nextProps.client.updatedAt &&
    prevProps.canDelete === nextProps.canDelete
  );
});

// Add displayName for better debugging
ClientListItem.displayName = 'ClientListItem';

export default ClientListItem;