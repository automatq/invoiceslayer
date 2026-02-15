"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteRecurringInvoice } from "@/app/actions/recurring";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RecurringInvoiceActions({ id }: { id: string }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this recurring invoice?")) {
            const result = await deleteRecurringInvoice(id);
            if (result.success) {
                toast.success("Recurring invoice deleted");
                router.refresh();
            } else {
                toast.error("Failed to delete recurring invoice");
            }
        }
    };

    return (
        <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/recurring/${id}/edit`}>
                    <Pencil className="h-4 w-4" />
                </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
