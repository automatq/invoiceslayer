import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/InvoiceForm";
import { getClients } from "@/app/actions/clients";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
    const clients = await getClients();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/invoices">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
            </div>
            <div className="mx-auto max-w-2xl">
                <InvoiceForm clients={clients} />
            </div>
        </div>
    );
}
