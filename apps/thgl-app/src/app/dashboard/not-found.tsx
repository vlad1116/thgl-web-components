import Link from "next/link";
import { Button } from "@repo/ui/controls";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-lg text-muted-foreground">Page Not Found</p>
      </div>

      <p className="text-sm text-muted-foreground max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Button asChild>
        <Link href="/dashboard">Go to Home</Link>
      </Button>
    </div>
  );
}
