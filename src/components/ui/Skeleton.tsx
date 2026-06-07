import { cn } from "@/lib/cn";

/** Loading placeholder. Shimmer is disabled under prefers-reduced-motion (see globals.css). */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-alt",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
