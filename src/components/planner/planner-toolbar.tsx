import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function PlannerToolbar() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
      <span className="text-sm font-semibold tracking-tight">
        MineColonies Planner
      </span>
      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" disabled>
          New Layout
        </Button>
        <Button variant="ghost" size="sm" disabled>
          Import
        </Button>
        <Button variant="ghost" size="sm" disabled>
          Export
        </Button>
      </div>
    </header>
  );
}