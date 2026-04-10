"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
      <h2 className="text-lg font-semibold text-zinc-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm">{error.message || "An unexpected error occurred."}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
