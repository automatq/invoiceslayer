"use client";

import * as React from "react";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    FileText,
    LayoutDashboard,
    FileSpreadsheet,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                    <CommandItem onSelect={() => runCommand(() => router.push("/quotes/new"))}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Create Quote</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/invoices/new"))}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Create Invoice</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/clients/new"))}>
                        <Smile className="mr-2 h-4 w-4" />
                        <span>Add Client</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/invoices"))}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        <span>Invoices</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/quotes"))}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Quotes</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/clients"))}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Clients</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
