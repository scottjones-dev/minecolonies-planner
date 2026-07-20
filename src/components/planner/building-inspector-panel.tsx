export function BuildingInspectorPanel() {
  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Inspector
      </span>
      <p className="text-sm text-muted-foreground">
        Select a building to see its details here.
      </p>
    </div>
  );
}