import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLearnLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-5 gap-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-48" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-5 gap-4">
          {/* Video Player Skeleton */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-video animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-300" />
            </div>
          </div>

          {/* Lesson Info Card Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm px-6 py-5 space-y-4">
            {/* Title and meta */}
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>

            {/* Tabs Skeleton */}
            <div className="border-t pt-4">
              <div className="flex gap-6 border-b border-gray-100 pb-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="pt-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <aside className="w-[380px] bg-white border-l border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <Skeleton className="flex-1 h-12 m-2 rounded" />
            <Skeleton className="flex-1 h-12 m-2 rounded" />
          </div>

          {/* Progress Header */}
          <div className="p-5 border-b border-gray-100 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* Chapter List Skeleton */}
          <div className="flex-1 overflow-hidden p-2 space-y-2">
            {[1, 2, 3].map((chapter) => (
              <div key={chapter} className="space-y-1">
                {/* Chapter Header */}
                <div className="px-3 py-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-4" />
                </div>
                {/* Lesson Items (only for first chapter) */}
                {chapter === 1 && (
                  <div className="space-y-1 pl-2">
                    {[1, 2, 3, 4].map((lesson) => (
                      <div
                        key={lesson}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
