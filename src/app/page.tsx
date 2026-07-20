import {
  Building2,
  Castle,
  Download,
  Save,
  Settings2,
  Upload,
} from "lucide-react";
import { BuildingLibraryPanel } from "@/components/planner/building-library-panel";
import { PlannerDndContext } from "@/components/planner/planner-dnd-context";
import { PlannerMapPanel } from "@/components/planner/planner-map-panel";
import { PlannerStatusBar } from "@/components/planner/planner-status-bar";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="grid h-dvh min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden bg-background text-foreground">
      <header className="flex min-h-14 items-center justify-between gap-4 border-b bg-card px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Castle className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              MineColonies Planner
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Untitled colony · Fortress style
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1" aria-label="Planner actions">
          <Button variant="ghost" size="icon-sm" aria-label="Import layout">
            <Upload aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Export layout">
            <Download aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm">
            <Save data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Planner settings">
            <Settings2 aria-hidden="true" />
          </Button>
        </nav>
      </header>

      <PlannerDndContext>
        <div className="grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <aside className="hidden min-h-0 border-r bg-card lg:block">
            <BuildingLibraryPanel />
          </aside>

          <PlannerMapPanel />

          <aside className="hidden min-h-0 flex-col border-l bg-card lg:flex">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Building inspector</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                View and edit the selected building.
              </p>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Building2
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-sm font-medium">Nothing selected</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Select a placed building to inspect its level, rotation,
                  footprint, and validation state.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </PlannerDndContext>

      <PlannerStatusBar />
    </main>
  );
}
