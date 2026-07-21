import { Castle, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BuildingInspectorPanel } from "@/components/planner/building-inspector-panel";
import { BuildingLibraryPanel } from "@/components/planner/building-library-panel";
import { ColonyBoundarySettings } from "@/components/planner/colony-boundary-settings";
import { KeyboardShortcutsHelp } from "@/components/planner/keyboard-shortcuts-help";
import { LocalLayoutControls } from "@/components/planner/local-layout-controls";
import { PlannerDndContext } from "@/components/planner/planner-dnd-context";
import { PlannerMapPanel } from "@/components/planner/planner-map-panel";
import { PlannerStatusBar } from "@/components/planner/planner-status-bar";
import { PlannerTransferControls } from "@/components/planner/planner-transfer-controls";
import { XaeroMapControls } from "@/components/planner/xaero-map-controls";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Planner",
  description:
    "Lay out a MineColonies settlement with block-accurate footprints, square claims, commutes, and guard coverage.",
  alternates: { canonical: "/planner" },
};

export default function PlannerPage() {
  return (
    <main className="grid h-dvh min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden bg-background text-foreground">
      <header className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b bg-card px-2 py-2 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            size="icon"
            variant="ghost"
            render={
              <Link
                href="/"
                aria-label="Back to the MineColonies Planner home page"
              />
            }
          >
            <Home aria-hidden="true" />
          </Button>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Castle className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              MineColonies Planner
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              Local-first colony planning
            </p>
          </div>
        </div>

        <nav
          className="flex max-w-[70vw] items-center gap-1 overflow-x-auto"
          aria-label="Planner actions"
        >
          <LocalLayoutControls />
          <XaeroMapControls />
          <PlannerTransferControls />
          <ColonyBoundarySettings />
          <KeyboardShortcutsHelp />
        </nav>
      </header>

      <PlannerDndContext>
        <div className="grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <aside className="hidden min-h-0 border-r bg-card lg:block">
            <BuildingLibraryPanel />
          </aside>
          <PlannerMapPanel />
          <aside className="hidden min-h-0 border-l bg-card lg:block">
            <BuildingInspectorPanel />
          </aside>
        </div>
      </PlannerDndContext>

      <PlannerStatusBar />
    </main>
  );
}
