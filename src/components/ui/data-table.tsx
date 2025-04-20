import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveTable } from "./responsive-table";

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: string;
    cell?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  isLoading?: boolean;
  skeletonRows?: number;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  skeletonRows = 5,
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <ResponsiveTable>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array(skeletonRows)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={`skeleton-row-${index}`}>
                      {columns.map((column) => (
                        <TableCell key={`skeleton-cell-${column.accessorKey}`}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
              : data.map((item) => (
                  <TableRow 
                    key={keyExtractor(item)}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={`${keyExtractor(item)}-${column.accessorKey}`}
                        className={column.className}
                      >
                        {column.cell
                          ? column.cell(item)
                          : String((item as Record<string, unknown>)[column.accessorKey] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </ResponsiveTable>
    </div>
  );
}