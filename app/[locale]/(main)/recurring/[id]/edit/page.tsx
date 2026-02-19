import { getClients } from "@/app/actions/clients";
import { getRecurringInvoice } from "@/app/actions/recurring";
import { getSettings } from "@/app/actions/settings";
import { RecurringInvoiceForm } from "@/components/RecurringInvoiceForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditRecurringInvoicePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const recurringInvoice = await getRecurringInvoice(id);
    const clients = await getClients();
    const settings = await getSettings();

    if (!recurringInvoice) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Edit Recurring Invoice</h1>
                <p className="text-muted-foreground">Update the schedule or template.</p>
            </div>
            <RecurringInvoiceForm
                clients={clients}
                initialData={recurringInvoice}
                defaultTaxRate={settings?.defaultTaxRate || 0}
            />
        </div>
    );
}
