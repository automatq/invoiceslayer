import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/InvoiceForm";
import { getClients } from "@/app/actions/clients";
import { getInvoice } from "@/app/actions/invoices";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [invoice, clients] = await Promise.all([
        getInvoice(id),
        getClients(),
    ]);

    if (!invoice) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/invoices/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
                    <p className="text-muted-foreground">
                        Update details for Invoice {invoice.number}
                    </p>
                </div>
            </div>
            <div className="mx-auto max-w-2xl">
                <InvoiceForm clients={clients} initialData={invoice} />
            </div>
        </div>
    );
}
