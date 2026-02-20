import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                <nav className="flex items-center gap-6 text-lg font-medium md:gap-5 md:text-sm lg:gap-6">
                    <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold md:text-base pointer-events-none"
                    >
                        <span className="text-primary font-bold tracking-tight">InvoiceMaster Portal</span>
                    </Link>
                </nav>
                <div className="ml-auto flex items-center gap-4">
                    {/* Theme toggle if available, otherwise omit */}
                </div>
            </header>
            <main className="p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
