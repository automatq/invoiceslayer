"use client";

import { updateInvoiceStatus, deleteInvoice } from "@/app/actions/invoices";
import { sendInvoiceEmail } from "@/app/actions/email";
import { getSettings } from "@/app/actions/settings";
import { generateInvoicePDF } from "@/lib/generatePdf";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import {
    Pencil,
    FileDown,
    Send,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Trash
} from "lucide-react";
import { Invoice } from "@prisma/client";
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog";

export function InvoiceActions({ invoice }: { invoice: Invoice }) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        const result = await updateInvoiceStatus(invoice.id, newStatus);
        if (result.success) {
            router.refresh();
        } else {
            alert(result.message || "Failed to update status");
        }
        setIsUpdating(false);
    };

    const handleGeneratePDF = async () => {
        const settings = await getSettings();
        generateInvoicePDF(invoice, settings);
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this invoice?")) {
            const result = await deleteInvoice(invoice.id);
            if (result.success) {
                toast.success("Invoice deleted");
                router.push("/invoices");
            } else {
                toast.error("Failed to delete invoice");
            }
        }
    };

    const handleSendEmail = async () => {
        setIsUpdating(true);
        const result = await sendInvoiceEmail(invoice.id);
        if (result.success) {
            toast.success("Invoice sent!", { description: "Email delivered successfully" });
            router.refresh();
        } else {
            toast.error("Failed to send email", { description: result.message });
        }
        setIsUpdating(false);
    };

    return (
        <div className="flex gap-2">
            <RecordPaymentDialog invoice={invoice} />
            <Button variant="outline" size="sm" asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
                <FileDown className="mr-2 h-4 w-4" />
                PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={isUpdating}>
                <Send className="mr-2 h-4 w-4" />
                Send Email
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Change Status"}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleStatusChange("DRAFT")}
                        disabled={invoice.status === "DRAFT"}
                    >
                        <FileDown className="mr-2 h-4 w-4 text-gray-500" />
                        Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange("SENT")}
                        disabled={invoice.status === "SENT"}
                    >
                        <Send className="mr-2 h-4 w-4 text-blue-500" />
                        Mark as Sent
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange("PAID")}
                        disabled={invoice.status === "PAID"}
                    >
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange("PARTIAL")}
                        disabled={invoice.status === "PARTIAL"}
                    >
                        <CheckCircle className="mr-2 h-4 w-4 text-yellow-500" />
                        Mark as Partial
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange("OVERDUE")}
                        disabled={invoice.status === "OVERDUE"}
                    >
                        <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                        Mark as Overdue
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleStatusChange("CANCELLED")}
                        disabled={invoice.status === "CANCELLED"}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Invoice
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={handleDelete}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Invoice
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
