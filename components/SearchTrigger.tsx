"use client";

import { Search } from "lucide-react";
import { InteractiveButton } from "./ui/interactive-button";

export function SearchTrigger() {
    return (
        <InteractiveButton
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground md:w-32 lg:w-48 h-8 pr-1.5"
            onClick={() => {
                // Trigger the same event as ⌘K (handled by CommandPalette)
                const event = new KeyboardEvent("keydown", {
                    key: "k",
                    metaKey: true,
                    bubbles: true,
                });
                document.dispatchEvent(event);
            }}
        >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Search...</span>
            <div className="flex-1" />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
        </InteractiveButton>
    );
}
