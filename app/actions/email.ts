"use server";

import { resend } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendInvoiceEmail(invoiceId: string, customSubject?: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true, items: true },
        });

        if (!invoice) {
            return { success: false, message: "Invoice not found" };
        }

        const settings = await prisma.setting.findFirst();
        const companyName = settings?.companyName || "InvoiceMaster";
        // const fromEmail = settings?.companyEmail || "noreply@invoicemaster.app";

        // Determine Base URL (simplistic for now, preferably from env)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const paymentLink = `${baseUrl}/p/invoice/${invoice.id}`;

        const itemsHtml = invoice.items
            .map(
                (item) => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.description}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.amount.toFixed(2)}</td>
            </tr>`
            )
            .join("");

        const emailSubject = customSubject || `Invoice ${invoice.number} from ${companyName}`;

        const { data, error } = await resend.emails.send({
            from: `${companyName} <onboarding@resend.dev>`,
            to: [invoice.client.email],
            subject: emailSubject,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background: #1a1a2e; color: #fff; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .body { padding: 32px; }
        .details { margin-bottom: 24px; }
        .details-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: 600; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        th:not(:first-child) { text-align: right; }
        .total-row { font-size: 18px; font-weight: 700; }
        .footer { background: #f8f9fa; padding: 24px 32px; text-align: center; color: #999; font-size: 12px; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
        .btn:hover { background-color: #1d4ed8; }
    </style>
</head>
<body>
    <div style="padding: 24px;">
        <div class="container">
            <div class="header">
                <h1>Invoice ${invoice.number}</h1>
            </div>
            <div class="body">
                <p>Hi ${invoice.client.name},</p>
                <p>Please find your invoice details below.</p>
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${paymentLink}" class="btn" style="color: #ffffff;">Pay Invoice Online</a>
                </div>

                <div style="margin: 24px 0;">
                    <table>
                        <tr>
                            <td style="padding: 4px 0; color: #666; font-size: 14px;">Invoice Number</td>
                            <td style="padding: 4px 0; font-weight: 600; text-align: right;">${invoice.number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #666; font-size: 14px;">Issue Date</td>
                            <td style="padding: 4px 0; font-weight: 600; text-align: right;">${new Date(invoice.date).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 4px 0; color: #666; font-size: 14px;">Due Date</td>
                            <td style="padding: 4px 0; font-weight: 600; text-align: right;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
                        </tr>
                    </table>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #1a1a2e;">
                    <span class="total-row">Total: $${invoice.total.toFixed(2)}</span>
                </div>

                <p style="margin-top: 32px; color: #666; font-size: 14px;">
                    If you have any questions about this invoice, please don't hesitate to reach out.
                </p>
                <p style="text-align: center; margin-top: 20px;">
                    <a href="${paymentLink}">View invoice in browser</a>
                </p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, message: error.message || "Failed to send email" };
        }

        // Update invoice status to SENT if it was DRAFT
        if (invoice.status === "DRAFT") {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: "SENT" },
            });
        }

        revalidatePath(`/invoices/${invoiceId}`);
        revalidatePath("/invoices");

        return { success: true, emailId: data?.id };
    } catch (e: any) {
        console.error("Email send error:", e);
        return { success: false, message: e.message || "An unexpected error occurred" };
    }
}

export async function sendQuoteEmail(quoteId: string) {
    try {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: { client: true, items: true },
        });

        if (!quote) {
            return { success: false, message: "Quote not found" };
        }

        const settings = await prisma.setting.findFirst();
        const companyName = settings?.companyName || "InvoiceMaster";

        const itemsHtml = quote.items
            .map(
                (item) => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.description}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.amount.toFixed(2)}</td>
            </tr>`
            )
            .join("");

        const { data, error } = await resend.emails.send({
            from: `${companyName} <onboarding@resend.dev>`,
            to: [quote.client.email],
            subject: `Quote ${quote.number} from ${companyName}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background: #1a1a2e; color: #fff; padding: 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .body { padding: 32px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        th:not(:first-child) { text-align: right; }
        .total-row { font-size: 18px; font-weight: 700; }
        .footer { background: #f8f9fa; padding: 24px 32px; text-align: center; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div style="padding: 24px;">
        <div class="container">
            <div class="header">
                <h1>Quote ${quote.number}</h1>
            </div>
            <div class="body">
                <p>Hi ${quote.client.name},</p>
                <p>Please find your quote details below. This quote is valid until ${new Date(quote.expiryDate).toLocaleDateString()}.</p>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #1a1a2e;">
                    <span class="total-row">Total: $${quote.total.toFixed(2)}</span>
                </div>

                <p style="margin-top: 32px; color: #666; font-size: 14px;">
                    If you're happy with this quote, please let us know and we'll convert it to an invoice.
                </p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, message: error.message || "Failed to send email" };
        }

        // Update quote status to SENT
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: "SENT" },
        });

        revalidatePath(`/quotes/${quoteId}`);
        revalidatePath("/quotes");

        return { success: true, emailId: data?.id };
    } catch (e: any) {
        console.error("Email send error:", e);
        return { success: false, message: e.message || "An unexpected error occurred" };
    }
}
