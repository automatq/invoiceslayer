"use client";

import { InvoiceRenderer } from "@/components/invoices/InvoiceRenderer";
import { cn } from "@/lib/utils";

interface InvoicePreviewProps {
    settings: {
        color: string;
        font: string;
        layout: string;
        logoUrl?: string;
    };
}

export function InvoicePreview({ settings }: InvoicePreviewProps) {
    // Mock Data using real company info where available
    const invoice = {
        number: "INV-001",
        date: new Date(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        client: {
            name: "John Doe",
            email: "john@example.com",
            address: "123 Main St\nCity, Country",
        },
        items: [
            { description: "Visual Design Project", quantity: 1, unitPrice: 1500, amount: 1500 },
            { description: "Strategy Session", quantity: 2, unitPrice: 200, amount: 400 },
        ],
        subtotal: 1900,
        taxTotal: 247,
        total: 2147,
        escrowContract: {
            platform: "FIGMA",
            condition: "APPROVED",
            status: "PENDING",
            resourceId: "https://figma.com/file/..."
        }
    };

    return (
        <InvoiceRenderer invoice={invoice as any} settings={settings as any} />
    );
}
