"use client";

import { deleteInvoice } from "@/app/actions/invoices";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, FileText, Pencil, Trash, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Invoice } from "@prisma/client";
import { generateInvoicePDF } from "@/lib/generatePdf";

interface InvoiceRowActionsProps {
    invoice: Invoice;
}

export function InvoiceRowActions({ invoice }: InvoiceRowActionsProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this invoice?")) {
            const result = await deleteInvoice(invoice.id);
            if (result.success) {
                toast.success("Invoice deleted");
                router.refresh();
            } else {
                toast.error("Failed to delete invoice");
            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/invoices/${invoice.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Invoice
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/invoices/${invoice.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Invoice
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => {
                        toast.promise(
                            new Promise((resolve) => {
                                generateInvoicePDF(invoice);
                                resolve(true);
                            }),
                            {
                                loading: "Generating PDF...",
                                success: "PDF downloaded",
                                error: "Failed to generate PDF",
                            }
                        );
                    }}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={handleDelete}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
