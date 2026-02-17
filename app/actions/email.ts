"use server";

import { Resend } from "resend";
import { getSettings } from "@/app/actions/settings";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getActiveTemplate } from "@/app/actions/templates";

const defaultResendKey = process.env.RESEND_API_KEY;
const defaultResend = defaultResendKey ? new Resend(defaultResendKey) : null;

async function getResendClient() {
    const settings = await getSettings();
    let apiKey = settings?.resendApiKey;

    if (!apiKey) {
        console.log("[Email] No settings API key found, falling back to env");
        apiKey = defaultResendKey;
    }

    if (!apiKey || apiKey.trim() === "" || apiKey.includes("YOUR_API_KEY")) {
        console.error("[Email] Invalid or missing Resend API Key.");
        throw new Error("Resend API Key is missing or invalid. Please configure it in Settings.");
    }

    return new Resend(apiKey.trim());
}

/**
 * Shared wrapper for branded emails
 */
function getBrandedEmailWrapper(content: string, title: string, brandColor: string, logoUrl: string | null, companyName: string) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: ${brandColor}; color: #fff; padding: 40px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; }
        .logo { max-height: 48px; margin-bottom: 16px; }
        .body { padding: 40px 32px; }
        .btn { display: inline-block; background-color: ${brandColor}; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 24px 0; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #eee; }
        th:not(:first-child) { text-align: right; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        td:not(:first-child) { text-align: right; }
        .total-row { font-size: 20px; font-weight: 800; color: ${brandColor}; }
        .footer { padding: 32px; text-align: center; color: #94a3b8; font-size: 12px; background: #f8fafc; }

        @media (prefers-color-scheme: dark) {
            body { background-color: #000000 !important; color: #e2e8f0 !important; }
            .container { background-color: #0a0a0a !important; color: #e2e8f0 !important; border: 1px solid #333333 !important; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8) !important; }
            .header h1 { color: #ffffff !important; }
            .body { color: #e2e8f0 !important; }
            .footer { background-color: #000000 !important; color: #94a3b8 !important; }
            
            /* Dark Mode Overrides */
            .text-main { color: #e2e8f0 !important; }
            .text-muted { color: #94a3b8 !important; }
            .text-inverse { color: #0f172a !important; } /* For things that need to stay dark on light backgrounds if specific */
            .border-color { border-color: #334155 !important; border-bottom-color: #334155 !important; border-top-color: #334155 !important; }
            .bg-muted { background-color: #334155 !important; color: #e2e8f0 !important; }
            .bg-subtle { background-color: #1e293b !important; }
            
            /* Specific Element Overrides for consistency */
            th { background-color: #1e293b !important; color: #94a3b8 !important; border-bottom-color: #334155 !important; }
            td { border-bottom-color: #334155 !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo">` : ''}
            <h1>${title}</h1>
        </div>
        <div class="body">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            <p>Built with InvoiceSlayer</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Layout generators that match app styles
 */
function getModernEmailHtml(invoiceData: any, settings: any, brandColor: string, logoUrl: string | null) {
    const itemsHtml = invoiceData.items.map((item: any) => `
        <tr>
            <td class="border-color text-main" style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 500;">${item.description}</td>
            <td class="border-color text-muted" style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #64748b;">${item.quantity}</td>
            <td class="border-color text-muted" style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; color: #64748b;">$${item.unitPrice.toFixed(2)}</td>
            <td class="border-color" style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; text-align: right; font-weight: bold; color: ${brandColor};">$${item.amount.toFixed(2)}</td>
        </tr>
    `).join("");

    return `
        <div style="margin-bottom: 32px;">
            <div style="font-size: 32px; font-weight: 800; tracking: -0.05em; color: ${brandColor}; margin-bottom: 8px;">INVOICE</div>
            <div class="text-muted" style="font-size: 14px; color: #64748b; font-weight: 500;">Issued: ${new Date(invoiceData.date).toLocaleDateString()}</div>
        </div>

        <table style="width: 100%; margin-bottom: 32px;">
            <tr>
                <td style="width: 50%; vertical-align: top;">
                    <div class="text-muted" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">Bill To</div>
                    <div class="text-main" style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${invoiceData.client.name}</div>
                    <div class="text-muted" style="font-size: 13px; color: #64748b; line-height: 1.5;">${invoiceData.client.address || ""}</div>
                    <div class="text-muted" style="font-size: 13px; color: #64748b;">${invoiceData.client.email || ""}</div>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                    <div class="text-muted" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">Pay To</div>
                    <div class="text-main" style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${settings.companyName}</div>
                    <div class="text-muted" style="font-size: 13px; color: #64748b; line-height: 1.5;">${settings.companyAddress || ""}</div>
                    ${settings.companyWebsite ? `<div style="font-size: 13px; color: ${brandColor}; text-decoration: underline;">${settings.companyWebsite}</div>` : ""}
                </td>
            </tr>
        </table>

        <div class="border-color" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead class="bg-muted" style="background: #f8fafc;">
                    <tr>
                        <th class="border-color text-muted" style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;">Description</th>
                        <th class="border-color text-muted" style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;">Qty</th>
                        <th class="border-color text-muted" style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;">Price</th>
                        <th class="border-color text-muted" style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
            <tr>
                <td style="text-align: right; vertical-align: top; width: 100%; border-bottom: none;">
                    <table style="width: 240px; margin-left: auto; border-collapse: collapse;">
                        <tr>
                            <td class="text-muted" style="padding: 4px 0; font-size: 14px; color: #64748b; border-bottom: none;">Subtotal</td>
                            <td class="text-muted" style="padding: 4px 0; font-size: 14px; color: #64748b; text-align: right; border-bottom: none;">$${invoiceData.subtotal?.toFixed(2) || "0.00"}</td>
                        </tr>
                        <tr>
                            <td class="text-muted" style="padding: 4px 0; font-size: 14px; color: #64748b; border-bottom: none;">Tax</td>
                            <td class="text-muted" style="padding: 4px 0; font-size: 14px; color: #64748b; text-align: right; border-bottom: none;">$${invoiceData.taxTotal?.toFixed(2) || "0.00"}</td>
                        </tr>
                        <tr>
                            <td class="text-main border-color" style="padding: 16px 0 0 0; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0; border-bottom: none;">Total</td>
                            <td class="border-color" style="padding: 16px 0 0 0; font-size: 24px; font-weight: 800; color: ${brandColor}; text-align: right; border-top: 1px solid #e2e8f0; border-bottom: none;">$${invoiceData.total.toFixed(2)}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;
}

function getClassicEmailHtml(invoiceData: any, settings: any, brandColor: string, logoUrl: string | null) {
    const itemsHtml = invoiceData.items.map((item: any) => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td class="border-color text-muted" style="padding: 16px 0; color: #444; border-bottom-color: #ddd;">${item.description}</td>
            <td class="border-color text-muted" style="padding: 16px 0; text-align: right; color: #444; border-bottom-color: #ddd;">${item.quantity}</td>
            <td class="border-color text-muted" style="padding: 16px 0; text-align: right; color: #444; border-bottom-color: #ddd;">$${item.unitPrice.toFixed(2)}</td>
            <td class="border-color text-main" style="padding: 16px 0; text-align: right; color: #000; font-weight: bold; border-bottom-color: #ddd;">$${item.amount.toFixed(2)}</td>
        </tr>
    `).join("");

    return `
        <div class="border-color" style="border-bottom: 2px solid #000; padding-bottom: 24px; margin-bottom: 32px;">
            <table style="width: 100%;">
                <tr>
                    <td>
                        <div class="text-main" style="font-family: serif; font-size: 44px; font-weight: bold; color: #000;">INVOICE</div>
                        <div class="text-muted" style="color: #666; font-size: 14px; margin-top: 4px;">#${invoiceData.number}</div>
                    </td>
                    <td style="text-align: right; vertical-align: bottom;">
                        <div class="text-main" style="font-weight: bold; font-size: 18px; color: #000;">${settings.companyName}</div>
                        ${settings.companyWebsite ? `<div class="text-muted" style="font-size: 13px; color: #666;">${settings.companyWebsite}</div>` : ""}
                    </td>
                </tr>
            </table>
        </div>

        <table style="width: 100%; margin-bottom: 32px; font-size: 14px;">
            <tr>
                <td style="width: 50%; vertical-align: top; border-bottom: none;">
                    <div class="text-main" style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 8px;">Bill To:</div>
                    <div class="text-main" style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${invoiceData.client.name}</div>
                    <div class="text-muted" style="color: #666; line-height: 1.5;">${invoiceData.client.address || ""}</div>
                    <div class="text-muted" style="color: #666;">${invoiceData.client.email || ""}</div>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right; border-bottom: none;">
                    <div class="text-main" style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 8px;">Pay To:</div>
                    <div class="text-main" style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${settings.companyName}</div>
                    <div class="text-muted" style="color: #666; line-height: 1.5;">${settings.companyAddress || ""}</div>
                    <div class="text-muted" style="color: #666; margin-top: 8px; font-weight: bold;">Date: <span style="font-weight: normal;">${new Date(invoiceData.date).toLocaleDateString()}</span></div>
                    <div class="text-muted" style="color: #666; font-weight: bold;">Due: <span style="font-weight: normal;">${new Date(invoiceData.dueDate).toLocaleDateString()}</span></div>
                </td>
            </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
            <thead>
                <tr class="border-color" style="border-bottom: 2px solid #000;">
                    <th class="text-main border-color" style="padding: 12px 0; text-align: left; font-weight: bold; color: #000; background: transparent; border-bottom-color: #000;">Description</th>
                    <th class="text-main border-color" style="padding: 12px 0; text-align: right; font-weight: bold; color: #000; background: transparent; border-bottom-color: #000;">Qty</th>
                    <th class="text-main border-color" style="padding: 12px 0; text-align: right; font-weight: bold; color: #000; background: transparent; border-bottom-color: #000;">Price</th>
                    <th class="text-main border-color" style="padding: 12px 0; text-align: right; font-weight: bold; color: #000; background: transparent; border-bottom-color: #000;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%; vertical-align: top; border-bottom: none;">
                    ${settings.paymentInstructions ? `
                        <div class="text-main" style="font-weight: bold; text-transform: uppercase; font-size: 11px; margin-bottom: 8px;">Payment Instructions</div>
                        <div class="text-muted border-color" style="font-size: 13px; color: #666; border-left: 2px solid #ddd; padding-left: 12px; font-style: italic;">
                            ${settings.paymentInstructions}
                        </div>
                    ` : ""}
                </td>
                <td style="width: 50%; vertical-align: top; border-bottom: none;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td class="text-muted border-color" style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; font-weight: bold; color: #666;">Subtotal</td>
                            <td class="text-main border-color" style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; text-align: right;">$${invoiceData.subtotal?.toFixed(2) || "0.00"}</td>
                        </tr>
                        <tr>
                            <td class="text-muted border-color" style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; font-weight: bold; color: #666;">Tax</td>
                            <td class="text-main border-color" style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; text-align: right;">$${invoiceData.taxTotal?.toFixed(2) || "0.00"}</td>
                        </tr>
                        <tr>
                            <td class="text-main" style="padding: 16px 0; font-size: 22px; font-weight: bold; border-bottom: none;">Total Due</td>
                            <td class="text-main" style="padding: 16px 0; font-size: 22px; font-weight: bold; text-align: right; border-bottom:  none;">$${invoiceData.total.toFixed(2)}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;
}

function getMinimalistEmailHtml(invoiceData: any, settings: any, brandColor: string, logoUrl: string | null) {
    const itemsHtml = invoiceData.items.map((item: any) => `
        <div class="border-color" style="padding: 12px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: baseline;">
            <div class="text-main" style="flex: 1; font-weight: 500;">${item.description}</div>
            <div class="text-muted" style="width: 60px; text-align: right; font-size: 13px; color: #64748b;">x${item.quantity}</div>
            <div class="text-main" style="width: 100px; text-align: right; font-weight: 500;">$${item.amount.toFixed(2)}</div>
        </div>
    `).join("");

    return `
        <div style="margin-bottom: 64px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${brandColor}; margin-bottom: 8px;">Invoice</div>
            <div class="text-main" style="font-size: 48px; font-weight: 300; letter-spacing: -0.05em; color: #000;">#${invoiceData.number}</div>
        </div>

        <table style="width: 100%; border-top: 1px solid #000; padding-top: 24px; margin-bottom: 64px; font-size: 14px;" class="border-color">
            <tr>
                <td style="width: 25%; vertical-align: top; border-bottom: none;">
                    <div class="text-muted" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px;">Issued</div>
                    <div class="text-main">${new Date(invoiceData.date).toLocaleDateString()}</div>
                </td>
                <td style="width: 25%; vertical-align: top; border-bottom: none;">
                    <div class="text-muted" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px;">Due</div>
                    <div class="text-main">${new Date(invoiceData.dueDate).toLocaleDateString()}</div>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right; border-bottom: none;">
                    <div class="text-muted" style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px;">Client</div>
                    <div class="text-main" style="font-weight: 700;">${invoiceData.client.name}</div>
                    <div class="text-muted" style="color: #64748b; line-height: 1.5; margin-top: 4px;">${invoiceData.client.address || ""}</div>
                </td>
            </tr>
        </table>

        <div style="margin-bottom: 48px;">
            ${itemsHtml}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
            <tr>
                <td style="text-align: right; vertical-align: top; width: 100%; border-bottom: none;">
                    <table style="width: 240px; margin-left: auto; border-collapse: collapse;">
                        <tr>
                            <td class="text-muted" style="padding: 4px 0; font-size: 13px; color: #94a3b8; border-bottom: none;">Subtotal</td>
                            <td class="text-muted" style="padding: 4px 0; font-size: 13px; color: #94a3b8; text-align: right; border-bottom: none;">$${invoiceData.subtotal?.toFixed(2) || "0.00"}</td>
                        </tr>
                        <tr>
                            <td class="text-muted" style="padding: 4px 0; font-size: 13px; color: #94a3b8; margin-bottom: 24px; border-bottom: none;">Tax</td>
                            <td class="text-muted" style="padding: 4px 0; font-size: 13px; color: #94a3b8; text-align: right; margin-bottom: 24px; border-bottom: none;">$${invoiceData.taxTotal?.toFixed(2) || "0.00"}</td>
                        </tr>
                        <tr>
                            <td class="text-main border-color" style="padding: 24px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid #000; border-bottom: none;">Total Due</td>
                            <td class="text-main border-color" style="padding: 24px 0 0 0; font-size: 32px; font-weight: 300; color: ${brandColor}; text-align: right; border-top: 1px solid #000; border-bottom: none;">$${invoiceData.total.toFixed(2)}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="border-color" style="margin-top: 80px; padding-top: 24px; border-top: 1px solid #eee; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
            <div class="text-main" style="font-weight: 800; margin-bottom: 4px; color: #000;">${settings.companyName}</div>
            <div class="text-muted">${settings.companyAddress || ""}</div>
            ${settings.companyWebsite ? `<div class="text-muted" style="margin-top: 4px;">${settings.companyWebsite}</div>` : ""}
        </div>
    `;
}

export async function sendInvoiceEmail(invoiceId: string, customSubject?: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true, items: true },
        });

        if (!invoice) return { success: false, message: "Invoice not found" };
        if (!invoice.client.email) return { success: false, message: "Client has no email" };

        const settings = await getSettings();
        const template = await getActiveTemplate();
        const resendClient = await getResendClient();

        const companyName = settings?.companyName || "InvoiceSlayer";
        const brandColor = template?.color || "#1a1a2e";
        const logoUrl = template?.logoUrl || settings?.companyLogo || null;
        // Logic Update: If no logo is resolved, force the email layout to Minimalist
        const layout = logoUrl ? (template?.layout || settings?.invoiceTemplate || "modern") : "minimalist";

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const paymentLink = `${baseUrl}/p/invoice/${invoice.id}`;

        let emailBody = "";
        if (layout === "classic") {
            emailBody = getClassicEmailHtml(invoice, settings, brandColor, logoUrl);
        } else if (layout === "minimalist") {
            emailBody = getMinimalistEmailHtml(invoice, settings, brandColor, logoUrl);
        } else {
            emailBody = getModernEmailHtml(invoice, settings, brandColor, logoUrl);
        }

        const emailContent = `
            ${emailBody}
            <div style="text-align: center; margin-top: 48px;">
                <a href="${paymentLink}" class="btn">View & Pay Invoice Online</a>
            </div>
            <p class="text-muted" style="margin-top: 40px; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                If you have any questions regarding this invoice, please don't hesitate to contact us by replying to this email.
            </p>
        `;

        const { data, error } = await resendClient.emails.send({
            from: `${companyName} <onboarding@resend.dev>`,
            to: [invoice.client.email],
            subject: customSubject || `Invoice ${invoice.number} from ${companyName}`,
            html: getBrandedEmailWrapper(emailContent, `Invoice ${invoice.number}`, brandColor, logoUrl, companyName),
        });

        if (error) throw error;

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

        if (!quote) return { success: false, message: "Quote not found" };
        if (!quote.client.email) return { success: false, message: "Client has no email" };

        const settings = await getSettings();
        const template = await getActiveTemplate();
        const resendClient = await getResendClient();

        const companyName = settings?.companyName || "InvoiceSlayer";
        const brandColor = template?.color || "#1a1a2e";
        const logoUrl = template?.logoUrl || settings?.companyLogo || null;
        // Logic Update: If no logo is resolved, force the email layout to Minimalist
        const layout = logoUrl ? (template?.layout || settings?.invoiceTemplate || "modern") : "minimalist";

        let emailBody = "";
        if (layout === "classic") {
            emailBody = getClassicEmailHtml(quote, settings, brandColor, logoUrl);
        } else if (layout === "minimalist") {
            emailBody = getMinimalistEmailHtml(quote, settings, brandColor, logoUrl);
        } else {
            emailBody = getModernEmailHtml(quote, settings, brandColor, logoUrl);
        }

        const emailContent = `
            ${emailBody}
            <p class="text-muted" style="margin-top: 48px; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                If you're happy with this quote, please let us know and we'll convert it to an invoice to begin.
            </p>
        `;

        const { data, error } = await resendClient.emails.send({
            from: `${companyName} <onboarding@resend.dev>`,
            to: [quote.client.email],
            subject: `Quote ${quote.number} from ${companyName}`,
            html: getBrandedEmailWrapper(emailContent, `Quote ${quote.number}`, brandColor, logoUrl, companyName),
        });

        if (error) throw error;

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

