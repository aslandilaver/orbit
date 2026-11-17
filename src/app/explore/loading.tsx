import { Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="container-page pt-10 sm:pt-14" aria-busy aria-label="Loading">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Skeleton className="mt-10 h-10 w-full" />
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
