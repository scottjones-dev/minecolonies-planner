"use client";

import { Check, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEmptyCatalog,
  createLocalLayout,
  type LocalLayout,
  type LocalLayoutCatalog,
  readLocalLayoutCatalog,
  writeLocalLayoutCatalog,
} from "@/lib/local-layouts";
import {
  getPlannerSnapshot,
  type PlannerSnapshot,
  usePlannerStore,
} from "@/stores/planner-store";

type NameDialogMode = "create" | "rename" | null;

function getBlankSnapshot(): PlannerSnapshot {
  const current = getPlannerSnapshot(usePlannerStore.getState());

  return {
    ...current,
    buildings: [],
    map: { zoom: 1, panX: 0, panY: 0 },
  };
}

export function LocalLayoutControls() {
  const [catalog, setCatalog] =
    useState<LocalLayoutCatalog>(createEmptyCatalog);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameDialogMode, setNameDialogMode] = useState<NameDialogMode>(null);
  const [name, setName] = useState("");
  const activeLayoutIdRef = useRef<string | null>(null);
  const catalogRef = useRef<LocalLayoutCatalog>(createEmptyCatalog());

  const commitCatalog = (nextCatalog: LocalLayoutCatalog) => {
    if (!writeLocalLayoutCatalog(nextCatalog)) {
      setError("This browser could not save the layout.");
    }
    activeLayoutIdRef.current = nextCatalog.activeLayoutId;
    catalogRef.current = nextCatalog;
    setCatalog(nextCatalog);
  };

  useEffect(() => {
    const stored = readLocalLayoutCatalog();
    let nextCatalog = stored.catalog;
    let storageError = stored.error;

    if (nextCatalog.layouts.length === 0) {
      const firstLayout = createLocalLayout(
        "My Colony",
        getPlannerSnapshot(usePlannerStore.getState()),
      );
      nextCatalog = {
        ...nextCatalog,
        activeLayoutId: firstLayout.id,
        layouts: [firstLayout],
      };
      if (!writeLocalLayoutCatalog(nextCatalog)) {
        storageError = "This browser could not save the layout.";
      }
    } else {
      const activeLayout =
        nextCatalog.layouts.find(
          (layout) => layout.id === nextCatalog.activeLayoutId,
        ) ?? nextCatalog.layouts[0];
      nextCatalog = {
        ...nextCatalog,
        activeLayoutId: activeLayout.id,
      };
      usePlannerStore.getState().loadSnapshot(activeLayout.planner);
    }

    activeLayoutIdRef.current = nextCatalog.activeLayoutId;
    catalogRef.current = nextCatalog;
    setCatalog(nextCatalog);
    setError(storageError);
    setReady(true);

    const unsubscribe = usePlannerStore.subscribe((state) => {
      const activeLayoutId = activeLayoutIdRef.current;

      if (!activeLayoutId) {
        return;
      }

      const latest = catalogRef.current;
      const now = new Date().toISOString();
      const layouts = latest.layouts.map((layout) =>
        layout.id === activeLayoutId
          ? {
              ...layout,
              planner: getPlannerSnapshot(state),
              updatedAt: now,
            }
          : layout,
      );
      const saved = { ...latest, activeLayoutId, layouts };
      if (!writeLocalLayoutCatalog(saved)) {
        setError("This browser could not save the layout.");
      }
      catalogRef.current = saved;
      setCatalog(saved);
    });

    return unsubscribe;
  }, []);

  const activeLayout = catalog.layouts.find(
    (layout) => layout.id === catalog.activeLayoutId,
  );

  const loadLayout = (layout: LocalLayout) => {
    const nextCatalog = { ...catalog, activeLayoutId: layout.id };
    commitCatalog(nextCatalog);
    usePlannerStore.getState().loadSnapshot(layout.planner);
  };

  const openNameDialog = (mode: Exclude<NameDialogMode, null>) => {
    setName(mode === "rename" ? (activeLayout?.name ?? "") : "");
    setNameDialogMode(mode);
  };

  const submitName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim().slice(0, 80);

    if (!normalizedName) {
      return;
    }

    if (nameDialogMode === "create") {
      const layout = createLocalLayout(normalizedName, getBlankSnapshot());
      const nextCatalog = {
        ...catalog,
        activeLayoutId: layout.id,
        layouts: [...catalog.layouts, layout],
      };
      commitCatalog(nextCatalog);
      usePlannerStore.getState().loadSnapshot(layout.planner);
    } else if (nameDialogMode === "rename" && activeLayout) {
      commitCatalog({
        ...catalog,
        layouts: catalog.layouts.map((layout) =>
          layout.id === activeLayout.id
            ? {
                ...layout,
                name: normalizedName,
                updatedAt: new Date().toISOString(),
              }
            : layout,
        ),
      });
    }

    setNameDialogMode(null);
  };

  const deleteActiveLayout = () => {
    if (!activeLayout) {
      return;
    }

    let layouts = catalog.layouts.filter(
      (layout) => layout.id !== activeLayout.id,
    );

    if (layouts.length === 0) {
      layouts = [createLocalLayout("My Colony", getBlankSnapshot())];
    }

    const nextActive = layouts[0];
    commitCatalog({
      ...catalog,
      activeLayoutId: nextActive.id,
      layouts,
    });
    usePlannerStore.getState().loadSnapshot(nextActive.planner);
  };

  if (!ready) {
    return (
      <span className="text-xs text-muted-foreground">Loading layouts…</span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Select
          value={catalog.activeLayoutId ?? undefined}
          onValueChange={(id) => {
            const layout = catalog.layouts.find(
              (candidate) => candidate.id === id,
            );
            if (layout) {
              loadLayout(layout);
            }
          }}
        >
          <SelectTrigger
            className="w-36 sm:w-48"
            aria-label="Current local layout"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {catalog.layouts.map((layout) => (
              <SelectItem key={layout.id} value={layout.id}>
                {layout.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Create layout"
          onClick={() => openNameDialog("create")}
        >
          <FilePlus2 aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Rename layout"
          onClick={() => openNameDialog("rename")}
          disabled={!activeLayout}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete layout"
          onClick={deleteActiveLayout}
          disabled={!activeLayout}
        >
          <Trash2 aria-hidden="true" />
        </Button>
        <span
          className="hidden items-center gap-1 text-xs text-muted-foreground xl:flex"
          title={error ?? "Changes are saved automatically in this browser."}
        >
          <Check className="size-3.5" aria-hidden="true" />
          {error ? "Save data reset" : "Saved locally"}
        </span>
      </div>

      <Dialog
        open={nameDialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setNameDialogMode(null);
          }
        }}
      >
        <DialogContent>
          <form className="space-y-5" onSubmit={submitName}>
            <DialogHeader>
              <DialogTitle>
                {nameDialogMode === "rename"
                  ? "Rename layout"
                  : "Create layout"}
              </DialogTitle>
              <DialogDescription>
                Layouts are stored only in this browser.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Colony name"
              maxLength={80}
              autoFocus
              aria-label="Layout name"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNameDialogMode(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {nameDialogMode === "rename" ? "Rename" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
