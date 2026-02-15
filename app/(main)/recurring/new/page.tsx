import { getClients } from "@/app/actions/clients";
import { getSettings } from "@/app/actions/settings";
import { RecurringInvoiceForm } from "@/components/RecurringInvoiceForm";

export const dynamic = "force-dynamic";

export default async function NewRecurringInvoicePage() {
    const clients = await getClients();
    const settings = await getSettings();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">New Recurring Invoice</h1>
                <p className="text-muted-foreground">Create a template for automated invoices.</p>
            </div>
            <RecurringInvoiceForm
                clients={clients}
                defaultTaxRate={settings?.defaultTaxRate || 0}
            />
        </div>
    );
}
