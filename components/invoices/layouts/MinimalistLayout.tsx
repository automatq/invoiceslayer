"use client";

import { InvoiceLayoutProps } from "../types";
import { cn } from "@/lib/utils";

import { getFontClassName } from "../utils";

export function MinimalistLayout({ invoice, settings }: InvoiceLayoutProps) {
    const fontClass = getFontClassName(settings.font);

    const accentColor = settings.color || "#000000";

    return (
        <div className={cn("w-full h-full bg-card text-card-foreground p-12 overflow-y-auto", fontClass)}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-16">
                    <div className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Invoice</div>
                    <div className="text-6xl font-light tracking-tighter">#{invoice.number}</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-4 gap-8 mb-16 border-t border-foreground pt-8">
                    <div className="col-span-1">
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Issued</div>
                        <div>{invoice.date.toLocaleDateString()}</div>
                    </div>
                    <div className="col-span-1">
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Due</div>
                        <div>{invoice.dueDate.toLocaleDateString()}</div>
                    </div>
                    <div className="col-span-2 text-right">
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Client</div>
                        <div className="font-bold">{invoice.client.name}</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.client.address}</div>
                    </div>
                </div>

                {/* Items */}
                <div className="mb-12">
                    {invoice.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-baseline py-4 border-b border-border group hover:bg-muted/50 transition-colors px-2 -mx-2">
                            <div className="flex-1">
                                <div className="font-medium">{item.description}</div>
                            </div>
                            <div className="w-20 text-right text-muted-foreground text-sm">x{item.quantity}</div>
                            <div className="w-32 text-right">${item.amount.toFixed(2)}</div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-16">
                    <div className="w-64">
                        <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>${invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-6 text-sm text-muted-foreground">
                            <span>Tax</span>
                            <span>${invoice.taxTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-6 border-t border-foreground">
                            <span className="text-sm uppercase tracking-widest font-bold">Total Due</span>
                            <span className="text-3xl font-light" style={{ color: accentColor }}>${invoice.total.toFixed(2)}</span>
                        </div>

                        {settings.cryptoWalletAddress && (
                            <div className="mt-8 pt-6 border-t border-foreground">
                                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4 text-right">Pay with USDC</div>
                                <div className="flex justify-end gap-4">
                                    <div className="text-[10px] text-muted-foreground break-all font-mono text-right max-w-[120px] self-end">
                                        {settings.cryptoWalletAddress}
                                    </div>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${settings.cryptoWalletAddress}`}
                                        alt="Crypto QR"
                                        className="h-16 w-16"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-[10px] text-muted-foreground mt-auto pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                        <div className="font-bold uppercase">{settings.companyName}</div>
                        <div>{settings.companyAddress}</div>
                        {settings.companyPhone && <div>{settings.companyPhone}</div>}
                        {settings.companyWebsite && <div>{settings.companyWebsite}</div>}
                        {settings.companyTaxId && <div>Tax ID: {settings.companyTaxId}</div>}
                    </div>
                    <div className="text-right space-y-1">
                        {settings.paymentInstructions && (
                            <div className="max-w-xs ml-auto">
                                <div className="font-bold uppercase mb-1">Payment</div>
                                <div className="whitespace-pre-wrap">{settings.paymentInstructions}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
