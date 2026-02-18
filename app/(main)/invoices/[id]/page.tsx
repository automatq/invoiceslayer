import { getInvoice } from "@/app/actions/invoices";
import { getActiveTemplate } from "@/app/actions/templates";
import { getSettings } from "@/app/actions/settings";
import { InvoiceActions } from "@/components/InvoiceActions";
import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceRenderer } from "@/components/invoices/InvoiceRenderer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [invoice, template, settings] = await Promise.all([
        getInvoice(id),
        getActiveTemplate(),
        getSettings()
    ]);

    if (!invoice) {
        notFound();
    }

    const { client, items, total, amountPaid, payments } = invoice;

    // Default values if not set (backward compatibility)
    const subtotal = invoice.subtotal || invoice.items.reduce((acc: any, item: any) => acc + item.amount, 0);
    const taxTotal = invoice.taxTotal || invoice.items.reduce((acc: any, item: any) => acc + (item.amount * ((item.taxRate || 0) / 100)), 0);
    const balanceDue = total - amountPaid;

    // Map Prisma data to InvoiceData interface
    const invoiceData = {
        number: invoice.number,
        date: new Date(invoice.date),
        dueDate: new Date(invoice.dueDate),
        client: {
            name: invoice.client.name,
            email: invoice.client.email,
            address: invoice.client.address || "",
            phone: invoice.client.phone || "",
            vatNumber: invoice.client.vatNumber || "",
        },
        items: invoice.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            taxRate: item.taxRate,
        })),
        subtotal: subtotal,
        taxTotal: taxTotal,
        total: total,
        amountPaid: amountPaid,
        notes: invoice.notes || undefined,
        status: invoice.status,
    };

    // Ensure template has valid defaults
    const invoiceSettings = {
        color: template?.color || "#0f172a",
        font: template?.font || "inter",
        layout: template?.layout || "modern",
        logoUrl: (template?.logoUrl || settings?.companyLogo) || undefined,
        companyName: settings?.companyName || "Your Company",
        companyEmail: settings?.companyEmail || undefined,
        companyAddress: settings?.companyAddress || undefined,
        companyPhone: settings?.companyPhone || undefined,
        companyWebsite: settings?.companyWebsite || undefined,
        companyTaxId: settings?.companyTaxId || undefined,
        paymentInstructions: settings?.paymentInstructions || undefined,
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <StatusBadge status={invoice.status} />
                </div>
                <div className="flex items-center gap-2">
                    <InvoiceActions invoice={invoice} />
                </div>
            </div>

            <div className="border rounded-lg shadow-sm overflow-hidden bg-white dark:bg-card">
                <InvoiceRenderer invoice={invoiceData} settings={invoiceSettings} />
            </div>
        </div>
    );
}
