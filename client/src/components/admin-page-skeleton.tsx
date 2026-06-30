import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar placeholder */}
      <aside className="hidden md:flex flex-col w-72 bg-primary fixed h-screen z-30 shrink-0" />

      {/* Main content */}
      <main className="flex-1 md:ml-72 p-6 md:p-8 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        {/* Filter / search bar */}
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 max-w-xs rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="bg-muted/40 flex items-center gap-4 px-4 py-3 border-b border-border">
            {[120, 180, 100, 100, 80].map((w, i) => (
              <Skeleton key={i} className="h-3.5 rounded" style={{ width: w }} />
            ))}
          </div>

          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0"
              style={{ opacity: 1 - i * 0.07 }}
            >
              <Skeleton className="h-4 w-[120px] rounded" />
              <Skeleton className="h-4 w-[180px] rounded" />
              <Skeleton className="h-4 w-[100px] rounded" />
              <Skeleton className="h-4 w-[100px] rounded" />
              <Skeleton className="h-6 w-[80px] rounded-full" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </main>
    </div>
  );
}
