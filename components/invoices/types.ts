export interface InvoiceData {
    number: string;
    date: Date;
    dueDate: Date;
    client: {
        name: string;
        email: string;
        address: string;
        phone?: string;
        vatNumber?: string | null;
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
        taxRate?: number;
    }[];
    subtotal: number;
    taxTotal: number;
    total: number;
    amountPaid?: number;
    notes?: string;
    status?: string;
    escrowContract?: {
        platform: string;
        condition: string;
        resourceId: string;
        status: string;
    } | null;
}

export interface InvoiceSettings {
    color: string;
    font: string;
    layout: string;
    logoUrl?: string;
    companyName?: string;
    companyEmail?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyWebsite?: string;
    companyTaxId?: string;
    paymentInstructions?: string;
    cryptoWalletAddress?: string;
}

export interface InvoiceLayoutProps {
    invoice: InvoiceData;
    settings: InvoiceSettings;
}
