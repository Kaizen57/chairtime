import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center">
        <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Scissors className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 mb-2">404</h1>
        <p className="text-zinc-500 mb-6">This page doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
