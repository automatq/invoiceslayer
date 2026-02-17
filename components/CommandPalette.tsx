"use client";

import * as React from "react";
import {
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    FileText,
    LayoutDashboard,
    FileSpreadsheet,
    Plus,
} from "lucide-react";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { searchClients, searchInvoices } from "@/app/actions/search";
import { useState, useEffect } from "react";

// Simple debounce hook implementation
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const [query, setQuery] = React.useState("");
    const debouncedQuery = useDebounceValue(query, 300);
    const [clients, setClients] = React.useState<any[]>([]);
    const [invoices, setInvoices] = React.useState<any[]>([]);
    const [smartAction, setSmartAction] = React.useState<{ type: string; url: string; label: string } | null>(null);

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

    React.useEffect(() => {
        if (!debouncedQuery) {
            setClients([]);
            setInvoices([]);
            return;
        }

        async function fetchData() {
            const [clientResults, invoiceResults] = await Promise.all([
                searchClients(debouncedQuery),
                searchInvoices(debouncedQuery),
            ]);
            setClients(clientResults);
            setInvoices(invoiceResults);
        }

        fetchData();
    }, [debouncedQuery]);

    // Smart Action Parsing
    React.useEffect(() => {
        const lowerQuery = query.toLowerCase();

        // Pattern: "invoice 500" or "invoice for 500"
        const invoiceMatch = lowerQuery.match(/invoice\s+(?:for\s+)?\$?(\d+)/);

        if (invoiceMatch) {
            const amount = invoiceMatch[1];
            setSmartAction({
                type: "invoice",
                url: `/invoices/new?amount=${amount}`, // We'll need to handle this param in the new invoice page
                label: `Create Invoice for $${amount}`,
            });
        } else if (lowerQuery.startsWith("create client ")) {
            const name = query.slice(14);
            setSmartAction({
                type: "client",
                url: `/clients/new?name=${encodeURIComponent(name)}`,
                label: `Create Client "${name}"`,
            });
        } else {
            setSmartAction(null);
        }

    }, [query]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    // Manual filtering for static items
    const suggestions = [
        { label: "Create Quote", icon: Calendar, url: "/quotes/new" },
        { label: "Create Invoice", icon: CreditCard, url: "/invoices/new" },
        { label: "Add Client", icon: Smile, url: "/clients/new" },
    ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

    const navigation = [
        { label: "Dashboard", icon: LayoutDashboard, url: "/" },
        { label: "Invoices", icon: FileSpreadsheet, url: "/invoices" },
        { label: "Quotes", icon: FileText, url: "/quotes" },
        { label: "Clients", icon: User, url: "/clients" },
        { label: "Settings", icon: Settings, url: "/settings", shortcut: "⌘S" },
    ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

    const hasResults = smartAction || clients.length > 0 || invoices.length > 0 || suggestions.length > 0 || navigation.length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[450px]">
                <DialogTitle className="sr-only">Command Palette</DialogTitle>
                <DialogDescription className="sr-only">Search for a command to run...</DialogDescription>
                <Command
                    shouldFilter={false}
                    className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
                >
                    <CommandInput
                        placeholder="Type a command or search..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {!hasResults && <CommandEmpty>No results found.</CommandEmpty>}

                        {smartAction && (
                            <CommandGroup heading="Smart Action">
                                <CommandItem onSelect={() => runCommand(() => router.push(smartAction.url))}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>{smartAction.label}</span>
                                </CommandItem>
                            </CommandGroup>
                        )}

                        {clients.length > 0 && (
                            <CommandGroup heading="Clients">
                                {clients.map((client) => (
                                    <CommandItem key={client.id} onSelect={() => runCommand(() => router.push(`/clients/${client.id}`))}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>{client.name}</span>
                                        <span className="ml-2 text-xs text-muted-foreground">{client.email}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {invoices.length > 0 && (
                            <CommandGroup heading="Invoices">
                                {invoices.map((inv) => (
                                    <CommandItem key={inv.id} onSelect={() => runCommand(() => router.push(`/invoices/${inv.id}`))}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span className="mr-2">{inv.number}</span>
                                        <span className="text-muted-foreground">- {inv.clientName}</span>
                                        <span className="ml-auto text-xs font-mono">${inv.total.toFixed(2)}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {suggestions.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Suggestions">
                                    {suggestions.map((item) => (
                                        <CommandItem key={item.url} onSelect={() => runCommand(() => router.push(item.url))}>
                                            <item.icon className="mr-2 h-4 w-4" />
                                            <span>{item.label}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {navigation.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Navigation">
                                    {navigation.map((item) => (
                                        <CommandItem key={item.url} onSelect={() => runCommand(() => router.push(item.url))}>
                                            <item.icon className="mr-2 h-4 w-4" />
                                            <span>{item.label}</span>
                                            {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
