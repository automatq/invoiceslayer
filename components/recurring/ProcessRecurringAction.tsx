"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { processRecurringInvoices } from "@/app/actions/recurring";

export function ProcessRecurringAction() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleProcess = async () => {
        setIsLoading(true);
        try {
            const result = await processRecurringInvoices();
            if (result.processed > 0) {
                toast.success(`Success!`, {
                    description: `Generated ${result.processed} new invoice${result.processed === 1 ? "" : "s"}.`
                });
                router.refresh();
            } else {
                toast.info("No invoices due", {
                    description: "All recurring schedules are up to date."
                });
            }
        } catch {
            toast.error("Process failed", {
                description: "An unexpected error occurred while processing recurring invoices."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <InteractiveButton
            onClick={handleProcess}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:w-auto"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <Play className="mr-2 h-4 w-4" />
                    Process Due Invoices
                </>
            )}
        </InteractiveButton>
    );
}
