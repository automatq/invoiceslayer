"use client";

import { InvoiceLayoutProps } from "../types";
import { cn } from "@/lib/utils";

import { getFontClassName } from "../utils";
import { ShieldCheck } from "lucide-react";

export function ClassicLayout({ invoice, settings }: InvoiceLayoutProps) {
    const fontClass = getFontClassName(settings.font);

    return (
        <div className={cn("w-full h-full bg-card text-card-foreground p-10 overflow-y-auto", fontClass)}>
            <div className="max-w-3xl mx-auto space-y-10">
                {/* Header */}
                <div className="border-b-2 border-border pb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-serif font-bold text-foreground mb-2">INVOICE</h1>
                        <p className="text-muted-foreground">#{invoice.number}</p>
                    </div>
                    <div className="text-right">
                        {settings.logoUrl && (
                            <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto mb-4 object-contain ml-auto" />
                        )}
                        <div className="text-foreground font-bold text-lg">{settings.companyName || "Your Company Name"}</div>
                        {settings.companyWebsite && <div className="text-primary text-sm underline">{settings.companyWebsite}</div>}
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-12 text-sm">
                    <div>
                        <h3 className="font-bold text-foreground mb-2 uppercase tracking-wide text-xs">Bill To:</h3>
                        <div className="text-foreground font-semibold">{invoice.client.name}</div>
                        <div className="text-muted-foreground whitespace-pre-wrap">{invoice.client.address}</div>
                        {invoice.client.email && <div className="text-muted-foreground">{invoice.client.email}</div>}
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold text-foreground mb-2 uppercase tracking-wide text-xs">Pay To:</h3>
                        <div className="text-foreground font-semibold">{settings.companyName}</div>
                        <div className="text-muted-foreground whitespace-pre-wrap">{settings.companyAddress}</div>
                        {settings.companyPhone && <div className="text-muted-foreground">{settings.companyPhone}</div>}
                        {settings.companyTaxId && <div className="text-muted-foreground mt-1 text-xs">Tax ID: {settings.companyTaxId}</div>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-4">
                    <div />
                    <div className="text-right">
                        <div className="mb-1">
                            <span className="font-bold text-foreground mr-2">Date:</span>
                            <span className="text-muted-foreground">{invoice.date.toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="font-bold text-foreground mr-2">Due Date:</span>
                            <span className="text-muted-foreground">{invoice.dueDate.toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-border">
                            <th className="py-3 text-left font-bold text-foreground">Description</th>
                            <th className="py-3 text-right font-bold text-foreground">Qty</th>
                            <th className="py-3 text-right font-bold text-foreground">Price</th>
                            <th className="py-3 text-right font-bold text-foreground">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, i) => (
                            <tr key={i} className="border-b border-border/50">
                                <td className="py-4 text-muted-foreground">{item.description}</td>
                                <td className="py-4 text-right text-muted-foreground">{item.quantity}</td>
                                <td className="py-4 text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</td>
                                <td className="py-4 text-right text-foreground font-medium">${item.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals & Instructions */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="pt-4">
                        {settings.paymentInstructions && (
                            <div className="space-y-2">
                                <h3 className="font-bold text-foreground uppercase tracking-wide text-xs">Payment Instructions</h3>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap border-l-4 border-border pl-4 italic">
                                    {settings.paymentInstructions}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <div className="w-full space-y-3">
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="font-bold text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="font-bold text-muted-foreground">Tax</span>
                            <span className="text-foreground">${invoice.taxTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-4">
                            <span className="font-bold text-2xl text-foreground">Total</span>
                            <span className="font-bold text-2xl text-foreground">${invoice.total.toFixed(2)}</span>
                        </div>

                        {settings.cryptoWalletAddress && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-4 justify-end">
                                    <div className="text-right">
                                        <div className="text-xs font-bold uppercase tracking-wide text-foreground mb-1">Pay with USDC</div>
                                        <div className="text-[10px] text-muted-foreground break-all font-mono max-w-[150px]">
                                            {settings.cryptoWalletAddress}
                                        </div>
                                    </div>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${settings.cryptoWalletAddress}`}
                                        alt="Crypto QR"
                                        className="h-20 w-20 border border-border"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-12 text-center text-muted-foreground text-sm border-t border-border mt-8">
                <p>Thank you for your business.</p>
            </div>
        </div>

    );
}
