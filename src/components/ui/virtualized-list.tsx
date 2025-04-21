import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  height?: number | string;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
}

export default function VirtualizedList<T>({
  items,
  height = 600,
  renderItem,
  itemHeight = 60,
  overscan = 5,
  onEndReached,
  endReachedThreshold = 0.8,
  className = '',
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [hasCalledEndReached, setHasCalledEndReached] = useState(false);

  // Create the virtualizer
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  // Check if we've scrolled near the end
  useEffect(() => {
    if (!onEndReached || hasCalledEndReached) return;

    const scrollOffset = virtualizer.scrollOffset;
    const scrollTotal = virtualizer.getTotalSize() - (parentRef.current?.clientHeight || 0);
    
    // If we've scrolled past the threshold and there are items, call onEndReached
    if (items.length > 0 && scrollTotal > 0 && scrollOffset / scrollTotal > endReachedThreshold) {
      setHasCalledEndReached(true);
      onEndReached();
    }
  }, [
    virtualizer.scrollOffset,
    virtualizer.getTotalSize(),
    items.length,
    onEndReached,
    hasCalledEndReached,
    endReachedThreshold
  ]);

  // Reset end reached flag when items change (likely from loading more)
  useEffect(() => {
    setHasCalledEndReached(false);
  }, [items.length]);

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{
        height,
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}