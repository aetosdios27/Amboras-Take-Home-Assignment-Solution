import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  error?: boolean;
}

/**
 * Consistent wrapper for all dashboard sections.
 * Handles the title/description/action header pattern so each
 * chart/table component stays focused on its data rendering.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  error = false,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-zinc-900",
        error ? "border-red-900/40" : "border-zinc-800",
        className
      )}
    >
      {/* Card header */}
      <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-4">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-600">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Card body */}
      <div className="p-6">{children}</div>
    </div>
  );
}
