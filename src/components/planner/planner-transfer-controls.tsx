"use client";

import { Download, PackageOpen, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStylePackById, stylePacks } from "@/data";
import {
  createLayoutTransferDocument,
  createStylePackTransferDocument,
  parsePlannerTransferDocument,
  readImportedStylePacks,
  writeImportedStylePacks,
} from "@/lib/planner-transfer";
import { getPlannerSnapshot, usePlannerStore } from "@/stores/planner-store";
import { useStylePackStore } from "@/stores/style-pack-store";

type ImportResult = {
  title: string;
  description: string;
  error: boolean;
};

function safeFileName(name: string): string {
  return (
    name
      .trim()
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "minecolonies"
  );
}

function downloadJson(fileName: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function PlannerTransferControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const importedStylePacks = useStylePackStore(
    (state) => state.importedStylePacks,
  );
  const importStylePack = useStylePackStore((state) => state.importStylePack);
  const setImportedStylePacks = useStylePackStore(
    (state) => state.setImportedStylePacks,
  );
  const activeStylePackId = usePlannerStore((state) => state.activeStylePackId);

  useEffect(() => {
    setImportedStylePacks(
      readImportedStylePacks().filter(
        (imported) => !stylePacks.some((builtIn) => builtIn.id === imported.id),
      ),
    );
  }, [setImportedStylePacks]);

  const exportLayout = () => {
    const planner = getPlannerSnapshot(usePlannerStore.getState());
    const document = createLayoutTransferDocument(
      "MineColonies colony",
      planner,
    );
    downloadJson("minecolonies-colony.json", document);
  };

  const exportStylePack = () => {
    const stylePack =
      getStylePackById(activeStylePackId) ??
      importedStylePacks[0] ??
      stylePacks[0];
    const document = createStylePackTransferDocument(stylePack);
    downloadJson(`${safeFileName(stylePack.name)}-style.json`, document);
  };

  const importFile = async (file: File) => {
    try {
      const document = parsePlannerTransferDocument(
        JSON.parse(await file.text()),
      );

      if (document.kind === "minecolonies-planner-layout") {
        usePlannerStore.getState().loadSnapshot(document.planner);
        setResult({
          title: "Layout imported",
          description: `${document.name} replaced the active local layout and was saved automatically.`,
          error: false,
        });
      } else {
        if (
          stylePacks.some((stylePack) => stylePack.id === document.stylePack.id)
        ) {
          throw new Error(
            "That style ID belongs to the built-in Fortress fallback and cannot be replaced.",
          );
        }

        importStylePack(document.stylePack);
        const saved = writeImportedStylePacks([
          ...importedStylePacks.filter(
            (stylePack) => stylePack.id !== document.stylePack.id,
          ),
          { ...document.stylePack, source: "imported" },
        ]);
        usePlannerStore.getState().setActiveStylePack(document.stylePack.id);
        setResult({
          title: "Style catalogue imported",
          description: `${document.stylePack.name} is now available in the building library${saved ? " and saved in this browser" : ""}.`,
          error: false,
        });
      }
    } catch (error) {
      setResult({
        title: "Import failed",
        description:
          error instanceof Error
            ? error.message
            : "The selected JSON file could not be imported.",
        error: true,
      });
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void importFile(file);
          }
          event.target.value = "";
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Import planner JSON"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload aria-hidden="true" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Export planner JSON"
            />
          }
        >
          <Download aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportLayout}>
            <Download aria-hidden="true" />
            Export active layout
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportStylePack}>
            <PackageOpen aria-hidden="true" />
            Export active style
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={result !== null}
        onOpenChange={(open) => {
          if (!open) {
            setResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>JSON import</DialogTitle>
            <DialogDescription>
              Only validated JSON data is read. Archives, NBT data, and mod JAR
              files are not processed.
            </DialogDescription>
          </DialogHeader>
          {result ? (
            <Alert variant={result.error ? "destructive" : "default"}>
              <AlertTitle>{result.title}</AlertTitle>
              <AlertDescription>{result.description}</AlertDescription>
            </Alert>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
