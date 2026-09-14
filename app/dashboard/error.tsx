"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-bold text-white">Something went wrong</h2>
        <p className="text-xs text-slate-400">
          {error.message || "An unexpected error occurred while loading dashboard content."}
        </p>
      </div>
      <Button
        onClick={() => reset()}
        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  );
}
