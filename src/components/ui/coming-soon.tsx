import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ComingSoonProps {
  title?: string;
  featureName?: string;
  estimatedRelease?: string;
  backLink?: string;
  backText?: string;
}

export function ComingSoon({
  title = "Feature Coming Soon",
  featureName,
  estimatedRelease,
  backLink = "/dashboard",
  backText = "Go Back",
}: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="relative mb-4">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/20 rounded-full blur opacity-30"></div>
        <div className="bg-background p-5 rounded-full relative">
          <Construction className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
      
      {featureName && (
        <p className="text-xl text-muted-foreground mb-4">
          This Feature is currently under development
        </p>
      )}
      
      <div className="max-w-md mb-8 text-muted-foreground">
        <p>
          We're working hard to bring this feature to you. Thank you for your patience!
        </p>
        
        {estimatedRelease && (
          <div className="flex items-center justify-center gap-1 mt-4 text-sm bg-primary/10 py-2 px-4 rounded-full">
            <CalendarClock className="h-4 w-4 mr-1" />
            <span>Estimated release: {estimatedRelease}</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-4">
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backText}
        </Button>
        
        <Button asChild>
          <Link href={backLink}>
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}