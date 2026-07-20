import {
  Box,
  Building2,
  Castle,
  Download,
  Save,
  Settings2,
  Shield,
  Upload,
} from "lucide-react";
import { PlannerMapPanel } from "@/components/planner/planner-map-panel";
import { PlannerStatusBar } from "@/components/planner/planner-status-bar";
import { Button } from "@/components/ui/button";

const librarySections = [
  { name: "Housing", count: 0, icon: Building2 },
  { name: "Production", count: 0, icon: Box },
  { name: "Military", count: 0, icon: Shield },
];

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

      <div className="grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        <aside className="hidden min-h-0 flex-col border-r bg-card lg:flex">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Building library</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Buildings from the selected MineColonies style pack will appear
              here.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {librarySections.map(({ name, count, icon: Icon }) => (
              <section key={name} className="rounded-lg border bg-background">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <Icon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <h3 className="flex-1 text-sm font-medium">{name}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
              </section>
            ))}
          </div>

          <div className="border-t p-3 text-xs text-muted-foreground">
            Building data will be added in ALI-17.
          </div>
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

      <PlannerStatusBar />
    </main>
  );
}
