export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 select-none animate-pulse">
      {/* Welcome Hero Banner Skeleton */}
      <div className="h-40 rounded-2xl border border-[#1e2235]/40 bg-[#0d0f17]/20 flex flex-col justify-center px-8 space-y-3">
        <div className="h-3 bg-accent/20 rounded w-24" />
        <div className="h-7 bg-zinc-800 rounded w-1/3" />
        <div className="h-4 bg-zinc-900 rounded w-1/2" />
      </div>

      {/* Stats Bento Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-[#1e2235]/40 bg-[#0f1118]/40 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 bg-zinc-800 rounded w-16" />
              <div className="w-8 h-8 rounded-xl bg-zinc-800" />
            </div>
            <div className="h-8 bg-zinc-800 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Middle Grid: Quick Actions + Upcoming Meetings Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions Panel Skeleton */}
        <div className="md:col-span-2 space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-28" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-[#1e2235]/40 bg-[#0f1118]/40 h-32" />
            <div className="p-6 rounded-2xl border border-[#1e2235]/40 bg-[#0f1118]/40 h-32" />
          </div>
        </div>

        {/* Upcoming Meetings List Skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-zinc-800 rounded w-36" />
          <div className="p-6 rounded-2xl border border-[#1e2235]/40 bg-[#0f1118]/40 h-44 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2 flex-1 mr-4">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="h-2.5 bg-zinc-900/80 rounded w-1/2" />
              </div>
              <div className="w-12 h-6 rounded-lg bg-zinc-800" />
            </div>
            <div className="flex justify-between items-center">
              <div className="space-y-2 flex-1 mr-4">
                <div className="h-3 bg-zinc-800 rounded w-2/3" />
                <div className="h-2.5 bg-zinc-900/80 rounded w-1/3" />
              </div>
              <div className="w-12 h-6 rounded-lg bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
