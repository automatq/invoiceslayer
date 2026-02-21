"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, DollarSign, User, MoreHorizontal, FileText, Receipt, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createInvoiceFromDeal, createQuoteFromDeal } from "@/app/actions/deal-invoice-integration";
import { deleteDeal } from "@/app/actions/deals";

interface Invoice {
    id: string;
    number: string;
    status: string;
    total: number;
    amountPaid: number;
}

interface Quote {
    id: string;
    number: string;
    status: string;
    total: number;
}

interface Deal {
    id: string;
    title: string;
    description: string | null;
    value: number;
    currency: string;
    priority: string;
    status: string;
    expectedClose: Date | null;
    client: {
        id: string;
        name: string;
        email: string;
    };
    activities: {
        id: string;
        type: string;
        description: string;
        createdAt: Date;
    }[];
    invoices?: Invoice[];
    quotes?: Quote[];
}

interface DealCardProps {
    deal: Deal;
    stageColor: string;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const priorityColors: Record<string, string> = {
    LOW: "bg-slate-500",
    MEDIUM: "bg-blue-500",
    HIGH: "bg-orange-500",
    URGENT: "bg-red-500",
};

export function DealCard({ deal, stageColor, draggable, onDragStart }: DealCardProps) {
    const router = useRouter();
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [isCreatingQuote, setIsCreatingQuote] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const formatDate = (date: Date | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const daysUntilClose = deal.expectedClose
        ? Math.ceil((new Date(deal.expectedClose).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    // Calculate invoice status
    const invoices = deal.invoices || [];
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const hasInvoices = invoices.length > 0;
    const isFullyPaid = totalPaid >= deal.value;
    const isPartiallyPaid = totalPaid > 0 && totalPaid < deal.value;

    const handleCreateInvoice = async () => {
        setIsCreatingInvoice(true);
        try {
            const result = await createInvoiceFromDeal(deal.id, {
                description: deal.title,
            });
            if (result.success) {
                toast.success("Invoice created", {
                    description: `Invoice ${result.invoice?.number} created successfully`,
                });
                router.push(`/invoices/${result.invoice?.id}`);
            } else {
                toast.error("Failed to create invoice", {
                    description: result.message,
                });
            }
        } catch (error) {
            toast.error("Error creating invoice");
        } finally {
            setIsCreatingInvoice(false);
        }
    };

    const handleCreateQuote = async () => {
        setIsCreatingQuote(true);
        try {
            const result = await createQuoteFromDeal(deal.id, {
                description: deal.title,
            });
            if (result.success) {
                toast.success("Quote created", {
                    description: `Quote ${result.quote?.number} created successfully`,
                });
                router.push(`/quotes/${result.quote?.id}`);
            } else {
                toast.error("Failed to create quote", {
                    description: result.message,
                });
            }
        } catch (error) {
            toast.error("Error creating quote");
        } finally {
            setIsCreatingQuote(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this deal?")) return;
        setIsDeleting(true);
        try {
            const result = await deleteDeal(deal.id);
            if (result.success) {
                toast.success("Deal deleted");
                router.refresh();
            } else {
                toast.error("Failed to delete deal", {
                    description: result.message,
                });
            }
        } catch (error) {
            toast.error("Error deleting deal");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card
            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
            draggable={draggable}
            onDragStart={onDragStart}
        >
            <CardContent className="p-4">
                {/* Header with priority and payment status */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-1 flex-wrap">
                        <Badge
                            variant="secondary"
                            className={`${priorityColors[deal.priority] || "bg-slate-500"} text-white text-xs`}
                        >
                            {deal.priority}
                        </Badge>
                        {isFullyPaid && (
                            <Badge variant="default" className="bg-green-600 text-white text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                PAID
                            </Badge>
                        )}
                        {isPartiallyPaid && (
                            <Badge variant="default" className="bg-yellow-500 text-white text-xs">
                                PARTIAL
                            </Badge>
                        )}
                        {hasInvoices && !isPartiallyPaid && !isFullyPaid && (
                            <Badge variant="outline" className="text-xs">
                                INVOICED
                            </Badge>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/pipeline?deal=${deal.id}`)}>
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleCreateQuote} disabled={isCreatingQuote}>
                                <FileText className="w-4 h-4 mr-2" />
                                {isCreatingQuote ? "Creating..." : "Create Quote"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCreateInvoice} disabled={isCreatingInvoice}>
                                <Receipt className="w-4 h-4 mr-2" />
                                {isCreatingInvoice ? "Creating..." : "Create Invoice"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-sm mb-1 line-clamp-2">{deal.title}</h4>

                {/* Client */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <User className="w-3 h-3" />
                    <span className="truncate">{deal.client?.name || "No Client"}</span>
                </div>

                {/* Value */}
                <div className="flex items-center gap-1 text-sm font-medium mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span>{deal.value.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs">{deal.currency}</span>
                </div>

                {/* Footer: Expected close date */}
                {deal.expectedClose && (
                    <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span
                            className={
                                daysUntilClose !== null && daysUntilClose < 0
                                    ? "text-red-500"
                                    : daysUntilClose !== null && daysUntilClose < 7
                                        ? "text-orange-500"
                                        : "text-muted-foreground"
                            }
                        >
                            {daysUntilClose !== null && daysUntilClose < 0
                                ? `${Math.abs(daysUntilClose)} days overdue`
                                : formatDate(deal.expectedClose)}
                        </span>
                    </div>
                )}

                {/* Stage indicator bar */}
                <div
                    className="h-1 mt-3 rounded-full"
                    style={{ backgroundColor: stageColor }}
                />
            </CardContent>
        </Card>
    );
}
