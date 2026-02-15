import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface CompanySettings {
    companyName: string;
    companyEmail: string;
    companyAddress?: string | null;
    companyPhone?: string | null;
    companyLogo?: string | null;
    invoiceTemplate?: string | null;
    quoteTemplate?: string | null;
}

function addPoweredBy(doc: jsPDF) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "italic");
        doc.text("powered by invoicemaster", 160, 285);
    }
}

function addCompanyHeader(doc: jsPDF, settings: CompanySettings, startX: number = 14, template: string = "modern") {
    let y = 15;

    if (template === "minimalist") {
        // Minimalist header: Center aligned or just simplified
        if (settings.companyLogo) {
            try {
                doc.addImage(settings.companyLogo, "PNG", 14, y, 20, 20);
                y += 25;
            } catch { }
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(settings.companyName, 14, y);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        let info = [];
        if (settings.companyAddress) info.push(settings.companyAddress);
        if (settings.companyEmail) info.push(settings.companyEmail);
        if (settings.companyPhone) info.push(settings.companyPhone);
        doc.text(info.join(" | "), 14, y + 5);
        return y + 15;
    }

    if (template === "professional") {
        // Professional: Right aligned header info, logo on left
        if (settings.companyLogo) {
            try {
                doc.addImage(settings.companyLogo, "PNG", startX, y, 22, 22);
            } catch { }
        }
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(settings.companyName, 196, y + 8, { align: "right" });
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        let infoY = y + 14;
        if (settings.companyAddress) {
            doc.text(settings.companyAddress, 196, infoY, { align: "right" });
            infoY += 5;
        }
        if (settings.companyEmail) {
            doc.text(settings.companyEmail, 196, infoY, { align: "right" });
            infoY += 5;
        }
        if (settings.companyPhone) {
            doc.text(settings.companyPhone, 196, infoY, { align: "right" });
        }
        return y + 30;
    }

    // Default: Modern
    if (settings.companyLogo) {
        try {
            doc.addImage(settings.companyLogo, "PNG", startX, y, 25, 25);
            const textX = startX + 30;
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(settings.companyName, textX, y + 8);
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            let infoY = y + 14;
            if (settings.companyAddress) {
                doc.text(settings.companyAddress, textX, infoY);
                infoY += 5;
            }
            if (settings.companyEmail) {
                doc.text(settings.companyEmail, textX, infoY);
                infoY += 5;
            }
            if (settings.companyPhone) {
                doc.text(settings.companyPhone, textX, infoY);
            }
        } catch {
            addTextOnlyHeader(doc, settings, startX, y);
        }
    } else {
        addTextOnlyHeader(doc, settings, startX, y);
    }
    return y + 30;
}

function addTextOnlyHeader(doc: jsPDF, settings: CompanySettings, startX: number, y: number) {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(settings.companyName, startX, y + 8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let infoY = y + 16;
    if (settings.companyAddress) {
        doc.text(settings.companyAddress, startX, infoY);
        infoY += 5;
    }
    if (settings.companyEmail) {
        doc.text(settings.companyEmail, startX, infoY);
        infoY += 5;
    }
    if (settings.companyPhone) {
        doc.text(settings.companyPhone, startX, infoY);
    }
}

export function generateInvoicePDF(invoice: any, settings?: CompanySettings | null) {
    const doc = new jsPDF();
    const template = settings?.invoiceTemplate || "modern";

    const company: CompanySettings = settings || {
        companyName: "InvoiceMaster",
        companyEmail: "",
    };

    const nextY = addCompanyHeader(doc, company, 14, template);

    // Invoice Title and Number
    doc.setFontSize(template === "minimalist" ? 14 : 16);
    doc.setFont("helvetica", "bold");
    if (template === "professional") {
        doc.text("INVOICE", 14, 22);
    } else {
        doc.text("INVOICE", 140, 22);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const rightX = template === "professional" ? 14 : 140;
    doc.text(`Number: ${invoice.number}`, rightX, 30);
    doc.text(`Date: ${format(new Date(invoice.date), "PPP")}`, rightX, 35);
    doc.text(`Due Date: ${format(new Date(invoice.dueDate), "PPP")}`, rightX, 40);

    // Bill To
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("BILL TO", 14, template === "minimalist" ? nextY : 56);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.client.name, 14, template === "minimalist" ? nextY + 7 : 63);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let clientY = template === "minimalist" ? nextY + 13 : 69;
    if (invoice.client.address) {
        doc.text(invoice.client.address, 14, clientY);
        clientY += 5;
    }
    if (invoice.client.email) {
        doc.text(invoice.client.email, 14, clientY);
        clientY += 5;
    }
    if (invoice.client.vatNumber) {
        doc.text(`GST/HST: ${invoice.client.vatNumber}`, 14, clientY);
    }

    // Items Table
    const tableColumn = ["Description", "Quantity", "Unit Price", "Tax", "Amount"];
    const tableRows = invoice.items.map((item: any) => [
        item.description,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `${item.taxRate || 0}%`,
        `$${item.amount.toFixed(2)}`,
    ]);

    const subtotal = invoice.subtotal ?? invoice.items.reduce((acc: number, item: any) => acc + item.amount, 0);
    const taxTotal = invoice.taxTotal ?? invoice.items.reduce((acc: number, item: any) => acc + (item.amount * ((item.taxRate || 0) / 100)), 0);
    const total = invoice.total;

    autoTable(doc, {
        startY: template === "minimalist" ? clientY + 10 : 90,
        head: [tableColumn],
        body: tableRows,
        foot: [
            ["", "", "", "Subtotal", `$${subtotal.toFixed(2)}`],
            ["", "", "", "Tax", `$${taxTotal.toFixed(2)}`],
            ["", "", "", "Total", `$${total.toFixed(2)}`]
        ],
        theme: template === "minimalist" ? "plain" : "striped",
        headStyles: {
            fillColor: template === "minimalist" ? [255, 255, 255] : [30, 30, 30],
            textColor: template === "minimalist" ? [0, 0, 0] : [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
            lineWidth: template === "minimalist" ? { bottom: 0.5 } : 0
        },
        bodyStyles: { fontSize: 9 },
        footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontSize: 10, fontStyle: "bold" },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Payment Terms: Net 30", 14, finalY + 8);

    addPoweredBy(doc);
    doc.save(`${invoice.number}.pdf`);
}

export function generateQuotePDF(quote: any, settings?: CompanySettings | null) {
    const doc = new jsPDF();
    const template = settings?.quoteTemplate || "modern";

    const company: CompanySettings = settings || {
        companyName: "InvoiceMaster",
        companyEmail: "",
    };

    const nextY = addCompanyHeader(doc, company, 14, template);

    // Quote Title and Number
    doc.setFontSize(template === "minimalist" ? 14 : 16);
    doc.setFont("helvetica", "bold");
    if (template === "professional") {
        doc.text("QUOTE", 14, 22);
    } else {
        doc.text("QUOTE", 140, 22);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const rightX = template === "professional" ? 14 : 140;
    doc.text(`Number: ${quote.number}`, rightX, 30);
    doc.text(`Date: ${format(new Date(quote.date), "PPP")}`, rightX, 35);
    doc.text(`Expiry: ${format(new Date(quote.expiryDate), "PPP")}`, rightX, 40);

    // Bill To
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("QUOTE FOR", 14, template === "minimalist" ? nextY : 56);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(quote.client.name, 14, template === "minimalist" ? nextY + 7 : 63);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let clientY = template === "minimalist" ? nextY + 13 : 69;
    if (quote.client.address) {
        doc.text(quote.client.address, 14, clientY);
        clientY += 5;
    }
    if (quote.client.email) {
        doc.text(quote.client.email, 14, clientY);
    }

    // Items Table
    const tableColumn = ["Description", "Quantity", "Unit Price", "Tax", "Amount"];
    const tableRows = quote.items.map((item: any) => [
        item.description,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `${item.taxRate || 0}%`,
        `$${item.amount.toFixed(2)}`,
    ]);

    const subtotal = quote.subtotal ?? quote.items.reduce((acc: number, item: any) => acc + item.amount, 0);
    const taxTotal = quote.taxTotal ?? quote.items.reduce((acc: number, item: any) => acc + (item.amount * ((item.taxRate || 0) / 100)), 0);
    const total = quote.total;

    autoTable(doc, {
        startY: template === "minimalist" ? clientY + 10 : 90,
        head: [tableColumn],
        body: tableRows,
        foot: [
            ["", "", "", "Subtotal", `$${subtotal.toFixed(2)}`],
            ["", "", "", "Tax", `$${taxTotal.toFixed(2)}`],
            ["", "", "", "Total", `$${total.toFixed(2)}`]
        ],
        theme: template === "minimalist" ? "plain" : "striped",
        headStyles: {
            fillColor: template === "minimalist" ? [255, 255, 255] : [30, 30, 30],
            textColor: template === "minimalist" ? [0, 0, 0] : [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
            lineWidth: template === "minimalist" ? { bottom: 0.5 } : 0
        },
        bodyStyles: { fontSize: 9 },
        footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontSize: 10, fontStyle: "bold" },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("This quote is valid until the expiry date.", 14, finalY);

    addPoweredBy(doc);
    doc.save(`${quote.number}.pdf`);
}
