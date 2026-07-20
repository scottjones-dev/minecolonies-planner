import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PlannerToolbar } from "@/components/planner/planner-toolbar";
import { BuildingLibraryPanel } from "@/components/planner/building-library-panel";
import { PlannerMapPanel } from "@/components/planner/planner-map-panel";
import { BuildingInspectorPanel } from "@/components/planner/building-inspector-panel";
import { PlannerStatusBar } from "@/components/planner/planner-status-bar";

export function PlannerShell() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <PlannerToolbar />
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={50} minSize={50} maxSize={30}>
            <BuildingLibraryPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={100} minSize={100}>
            <PlannerMapPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={50} maxSize={30}>
            <BuildingInspectorPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <PlannerStatusBar />
    </div>
  );
}