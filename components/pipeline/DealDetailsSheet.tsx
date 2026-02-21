"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { getDeal, deleteDeal } from "@/app/actions/deals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, User, Mail, Clock, FileText, Receipt, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface DealDetailsSheetProps {
    dealId: string | null;
    onClose: () => void;
}

export function DealDetailsSheet({ dealId, onClose }: DealDetailsSheetProps) {
    const [deal, setDeal] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (dealId) {
            fetchDeal();
        } else {
            setDeal(null);
        }
    }, [dealId]);

    async function fetchDeal() {
        if (!dealId) return;
        setLoading(true);
        try {
            const data = await getDeal(dealId);
            setDeal(data);
        } catch (error) {
            console.error("Failed to fetch deal:", error);
            toast.error("Failed to load deal details");
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async () => {
        if (!deal || !confirm("Are you sure you want to delete this deal?")) return;
        setIsDeleting(true);
        try {
            const result = await deleteDeal(deal.id);
            if (result.success) {
                toast.success("Deal deleted");
                onClose();
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
        <Sheet open={!!dealId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : deal ? (
                    <>
                        <SheetHeader className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="uppercase">
                                    {deal.status}
                                </Badge>
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDelete} disabled={isDeleting}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                            <SheetTitle className="text-2xl">{deal.title}</SheetTitle>
                            <SheetDescription>{deal.description || "No description provided."}</SheetDescription>
                        </SheetHeader>

                        <div className="grid gap-6 py-6">
                            {/* Value and Client */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Deal Value</p>
                                    <div className="flex items-center gap-1 text-xl font-bold">
                                        <DollarSign className="w-5 h-5 text-green-500" />
                                        <span>{deal.value.toLocaleString()}</span>
                                        <span className="text-sm font-normal text-muted-foreground uppercase">{deal.currency}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Client</p>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="font-medium">{deal.client.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="w-3 h-3" />
                                        <span>{deal.client.email}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Important Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Expected Close</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{deal.expectedClose ? format(new Date(deal.expectedClose), "PPP") : "Not set"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Created</p>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>{format(new Date(deal.createdAt), "PPP")}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Related Items */}
                            <div className="space-y-4">
                                <h4 className="font-semibold">Linked Documents</h4>
                                <div className="grid gap-2">
                                    {deal.quotes?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium uppercase text-muted-foreground">Quotes</p>
                                            {deal.quotes.map((quote: any) => (
                                                <div key={quote.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <FileText className="w-4 h-4 text-primary" />
                                                        <span>{quote.number}</span>
                                                    </div>
                                                    <Badge variant="secondary">{quote.status}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {deal.invoices?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium uppercase text-muted-foreground">Invoices</p>
                                            {deal.invoices.map((inv: any) => (
                                                <div key={inv.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Receipt className="w-4 h-4 text-primary" />
                                                        <span>{inv.number}</span>
                                                    </div>
                                                    <Badge variant="secondary">{inv.status}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!deal.quotes?.length && !deal.invoices?.length && (
                                        <p className="text-sm text-muted-foreground italic">No quotes or invoices linked yet.</p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Activities */}
                            <div className="space-y-4">
                                <h4 className="font-semibold">Activity History</h4>
                                <div className="space-y-4">
                                    {deal.activities?.map((activity: any) => (
                                        <div key={activity.id} className="flex gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <div className="space-y-1">
                                                <p className="font-medium">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(activity.createdAt), "PPp")}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!deal.activities || deal.activities.length === 0) && (
                                        <p className="text-sm text-muted-foreground italic">No activities logged yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Deal not found
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
