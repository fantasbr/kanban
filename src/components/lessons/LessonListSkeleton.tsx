export function LessonListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      
      {/* Mobile Skeleton */}
      <div className="space-y-3 md:hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted animate-pulse rounded w-full" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </div>
            <div className="h-8 bg-muted animate-pulse rounded w-full" />
          </div>
        ))}
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="bg-muted/50 p-3 flex gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded flex-1" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <div key={j} className="h-4 bg-muted animate-pulse rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
