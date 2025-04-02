import { DashboardHeader } from "@/components/dashboard/dashboard-header";

interface DashboardWrapperProps {
  children: React.ReactNode;
  noHeader?: boolean;
}

export function DashboardWrapper({ 
  children, 
  noHeader = false 
}: DashboardWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {!noHeader && <DashboardHeader />}
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {children}
      </main>
    </div>
  );
}