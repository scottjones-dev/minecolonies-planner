"use client";

import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

const shortcuts = [
  { keys: ["R"], action: "Rotate the selected building 90°" },
  { keys: ["Delete"], action: "Remove the selected building" },
  { keys: ["?"], action: "Open this keyboard shortcuts guide" },
  { keys: ["Esc"], action: "Close an open menu or dialog" },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (!isEditing && event.key === "?") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Keyboard shortcuts"
        onClick={() => setOpen(true)}
      >
        <CircleHelp aria-hidden="true" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Select a building on the map before using building shortcuts.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.action}
              className="flex items-center justify-between gap-4"
            >
              <dt className="text-sm text-muted-foreground">
                {shortcut.action}
              </dt>
              <dd className="flex shrink-0 gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
