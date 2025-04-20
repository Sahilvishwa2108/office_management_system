"use client";

import { useState, useEffect } from "react";

type MediaQueryProps = {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
};

export function useMediaQuery(): MediaQueryProps {
  const [matches, setMatches] = useState<MediaQueryProps>({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    xxl: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const smallQuery = window.matchMedia("(min-width: 640px)");
    const mediumQuery = window.matchMedia("(min-width: 768px)");
    const largeQuery = window.matchMedia("(min-width: 1024px)");
    const xlQuery = window.matchMedia("(min-width: 1280px)");
    const xxlQuery = window.matchMedia("(min-width: 1536px)");

    const updateMatches = () => {
      setMatches({
        sm: smallQuery.matches,
        md: mediumQuery.matches,
        lg: largeQuery.matches,
        xl: xlQuery.matches,
        xxl: xxlQuery.matches,
      });
    };

    updateMatches();

    smallQuery.addEventListener("change", updateMatches);
    mediumQuery.addEventListener("change", updateMatches);
    largeQuery.addEventListener("change", updateMatches);
    xlQuery.addEventListener("change", updateMatches);
    xxlQuery.addEventListener("change", updateMatches);

    return () => {
      smallQuery.removeEventListener("change", updateMatches);
      mediumQuery.removeEventListener("change", updateMatches);
      largeQuery.removeEventListener("change", updateMatches);
      xlQuery.removeEventListener("change", updateMatches);
      xxlQuery.removeEventListener("change", updateMatches);
    };
  }, []);

  return matches;
}