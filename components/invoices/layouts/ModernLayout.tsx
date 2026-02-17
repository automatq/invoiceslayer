"use client";

import { InvoiceLayoutProps } from "../types";
import { cn } from "@/lib/utils";

import { getFontClassName } from "../utils";
import { ShieldCheck } from "lucide-react";

export function ModernLayout({ invoice, settings }: InvoiceLayoutProps) {
    const fontClass = getFontClassName(settings.font);

    const style = {
        "--primary-brand": settings.color,
    } as React.CSSProperties;

    return (
        <div
            className={cn("w-full h-full bg-card text-card-foreground p-8 overflow-y-auto", fontClass)}
            style={style}
        >
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto mb-4" />
                        ) : (
                            <div
                                className="h-12 w-12 rounded-lg bg-[var(--primary-brand)] flex items-center justify-center text-white font-bold text-xl mb-4"
                            >
                                LOGO
                            </div>
                        )}
                        <h1
                            className="text-4xl font-extrabold tracking-tight"
                            style={{ color: settings.color }}
                        >
                            INVOICE
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Issued: {invoice.date.toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">#{invoice.number}</div>
                        <div className="text-sm text-muted-foreground mt-1">Due: {invoice.dueDate.toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <h3
                            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                        >
                            Bill To
                        </h3>
                        <div className="font-bold text-xl text-foreground">{invoice.client.name}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.client.address}</div>
                        <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
                    </div>
                    <div className="space-y-2 text-right">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pay To</h3>
                        <div className="font-bold text-xl text-foreground">{settings.companyName || "Your Company"}</div>
                        {settings.companyAddress && <div className="text-sm text-muted-foreground whitespace-pre-wrap">{settings.companyAddress}</div>}
                        {settings.companyPhone && <div className="text-sm text-muted-foreground">{settings.companyPhone}</div>}
                        {settings.companyWebsite && <div className="text-sm text-primary underline truncate ml-auto max-w-[200px] block">{settings.companyWebsite}</div>}
                        {settings.companyTaxId && <div className="text-xs text-muted-foreground mt-1">Tax ID: {settings.companyTaxId}</div>}
                    </div>
                </div>

                {/* Items */}
                <div className="rounded-lg border border-border/60 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border/60">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Description</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Qty</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Price</th>
                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {invoice.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-3 px-4 text-foreground font-medium">{item.description}</td>
                                    <td className="py-3 px-4 text-right text-muted-foreground">{item.quantity}</td>
                                    <td className="py-3 px-4 text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-foreground" style={{ color: settings.color }}>
                                        ${item.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals & Instructions */}
                <div className="flex flex-col sm:flex-row justify-between gap-8">
                    <div className="flex-1">
                        {settings.paymentInstructions && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Instructions</h3>
                                <div className="text-sm text-foreground bg-muted/30 p-4 rounded-lg border border-border/40 whitespace-pre-wrap">
                                    {settings.paymentInstructions}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full sm:w-64 space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Tax</span>
                        <span>${invoice.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-border/60 my-2" />
                    <div className="flex justify-between items-end">
                        <span className="font-bold text-foreground">Total</span>
                        <span
                            className="font-bold text-2xl"
                            style={{ color: settings.color }}
                        >
                            ${invoice.total.toFixed(2)}
                        </span>
                    </div>

                    {settings.cryptoWalletAddress && (
                        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/40 text-center">
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pay with USDC</div>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${settings.cryptoWalletAddress}`}
                                alt="Crypto QR"
                                className="h-24 w-24 mx-auto mb-2 mix-blend-multiply dark:mix-blend-normal rounded-sm"
                            />
                            <div className="text-[10px] text-muted-foreground break-all font-mono">
                                {settings.cryptoWalletAddress}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="pt-8 text-center text-xs text-muted-foreground">
                <p>Thank you for your business!</p>
            </div>
        </div>

    );
}
