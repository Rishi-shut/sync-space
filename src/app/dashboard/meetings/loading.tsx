export default function MeetingsLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 select-none animate-pulse">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-6 bg-zinc-800 rounded w-24" />
        <div className="h-4 bg-zinc-900 rounded w-80" />
      </div>

      {/* Start / Join Widget Skeleton */}
      <div className="max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-[#1e2235]/40 bg-[#0f1118]/40 h-32" />
        <div className="p-6 rounded-2xl border border-[#1e2235]/40 bg-[#0f1118]/40 h-32" />
      </div>

      {/* Meeting Rooms List Skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-36" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-[#1e2235]/40 bg-[#18181b]/30 flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 bg-zinc-800 rounded w-28" />
                  <div className="h-4 bg-zinc-900 rounded-full w-12" />
                </div>
                <div className="h-2.5 bg-zinc-900 rounded w-20" />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="w-20 h-6 rounded-lg bg-zinc-900" />
                <div className="w-24 h-8 rounded-lg bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
