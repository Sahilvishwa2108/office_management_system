"use client";

import { ComingSoon } from "@/components/ui/coming-soon";
import { usePathname } from "next/navigation";
import { use } from "react"; // Add this import

// Define your upcoming features with their metadata
const upcomingFeatures: Record<string, {
  title: string;
  featureName: string;
  estimatedRelease?: string;
}> = {
  "analytics": {
    title: "Advanced Analytics",
    featureName: "In-depth data insights and reporting",
    estimatedRelease: "Q3 2025"
  },
  "customization": {
    title: "User Customization",
    featureName: "Personalize your dashboard experience",
    estimatedRelease: "Q4 2025"
  }
};

export default function UpcomingFeaturePage({ params }: { params: { slug: string[] } }) {
  const paramsData = use(params);
  const slug = paramsData.slug || [];
  
  // Get the feature identifier from the URL
  const featureId = slug[0] || '';
  
  // Find feature data or use defaults
  const feature = upcomingFeatures[featureId] || {
    title: "Feature Coming Soon",
    featureName: featureId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  };
  
  return (
    <ComingSoon 
      title={feature.title}
      featureName={feature.featureName}
      estimatedRelease={feature.estimatedRelease}
      backLink="/dashboard"
    />
  );
}